# Khai Space Hub — Phase 6.2.1 Remediation Preflight & Deployment Runbook

**Document Version:** 1.0.0 (Phase 6.2.1)  
**Application Target:** `apps/hub/`  
**Branch:** `feature/khai-space-hub`  
**Repository:** `khairultajudin/khaispace`  
**Supabase Project Target:** `khai-space-hub` (`dpicdhjaabfjbvppmsxk`, `ap-southeast-1`)  
**Status:** `NOT DEPLOYED — PREPARATION & DOCUMENTATION ONLY`  

> [!IMPORTANT]
> This document prepares the preflight checks, recovery snapshot requirements, `profiles` `INSERT` analysis, and deployment runbook for owner review. **It does not authorize or execute any remote database operation.**

---

## 1. Data Baseline & Baseline-Aware Test Cleanup Procedure

### 1.1 Production Baseline Correction
- **Prior Assumption Removed:** Earlier Phase 6 notes required `0` rows across all 12 `public` tables and `auth.users`. That assumption is **invalid** whenever an owner Auth account or legitimate workspace data exists in `dpicdhjaabfjbvppmsxk`.
- **Rule:** The existing owner `auth.users` account and any legitimate production records **must remain untouched**. Never delete, truncate, or reset production data to satisfy a test precondition.

### 1.2 Exact Test Fixtures Created by `02_rls_and_isolation_test.sql`
[`02_rls_and_isolation_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/02_rls_and_isolation_test.sql#L20-L72) runs inside a single `DO $$ ... END $$;` block and creates ephemeral records with deterministic identities:
- **`auth.users` / `public.profiles` UUIDs & Emails:**
  - `11111111-1111-1111-1111-111111111111` (`owner-a@example.com`)
  - `22222222-2222-2222-2222-222222222222` (`owner-b@example.com`)
  - `33333333-3333-3333-3333-333333333333` (`admin-a@example.com`)
  - `44444444-4444-4444-4444-444444444444` (`member-a@example.com` / `synced-member@example.com` in `POST_REMEDIATION`)
  - `55555555-5555-5555-5555-555555555555` (`viewer-a@example.com`)
  - `66666666-6666-6666-6666-666666666666` (`suspended-a@example.com`)
  - `77777777-7777-7777-7777-777777777777` (`nonmember@example.com`)
  - `88888888-8888-8888-8888-888888888888` (`invited@example.com`)
- **Workspaces & Child Records:** Workspaces named `'Workspace A'` and `'Workspace B'`, plus projects (`'alpha'`, `'beta'`, `'owner-proj'`), milestones, tasks, financial transactions, invitations (`'owner-invitee@example.com'`, `'invited@example.com'`), and activity logs tied to those workspace/user UUIDs.

### 1.3 Baseline-Aware Cleanup Verification Procedure
1. **Capture Pre-Test Baseline:** Record row counts for `auth.users` and all 12 `public` tables, plus existing `auth.users(id, email)` and `public.workspaces(id, name)`.
2. **Confirm Intentional Rollback Marker:** Verify `02_rls_and_isolation_test.sql` terminates with:
   `PHASE_6_1_3_ALL_TESTS_PASSED_INTENTIONAL_ROLLBACK [MODE: POST_REMEDIATION]`
3. **Verify Fixture Absence:** Query `auth.users` and `public.profiles` for the 8 deterministic test UUIDs (`11111111-...` through `88888888-...`) and `@example.com` test emails, and `public.workspaces` for `'Workspace A'` / `'Workspace B'`. All must return `0` rows.
4. **Verify Baseline Preservation:** Re-record row counts and confirm existing owner/production records remain identical to the pre-test baseline.
5. **Limitation of Row Counts Alone:** Row counts alone do **not** prove clean rollback—for example, concurrent activity (`+1` production row, `-1` deleted row) or a swapped/mutated baseline row could yield identical counts. Both **zero test-fixture-ID matches** and **unchanged baseline records** are required.

---

## 2. Pre-Deployment Snapshot Checklist & Post-`COMMIT` Recovery Plan

### 2.1 Pre-Deployment Snapshot Checklist (Read-Only)
Before executing any remediation DDL, the operator must capture and retain output from the following read-only catalog queries:
1. **Function Definitions & Security Attributes** (`public` schema):
   - `pg_get_functiondef(p.oid)`, `p.prosecdef`, `p.proconfig` (`search_path`), `pg_get_userbyid(p.proowner)`, `p.proacl` for all `prokind = 'f'` functions in `public` (specifically preserving the Phase 6 definition of `log_workspace_activity()`, `handle_updated_at()`, and `prevent_note_type_change()`).
2. **Trigger Definitions & Enabled States:**
   - `n.nspname`, `c.relname`, `t.tgname`, `t.tgenabled`, `pg_get_triggerdef(t.oid)` for all non-internal triggers in `public` and on `auth.users`.
3. **Table, View, Column & Function ACLs:**
   - `pg_class.relacl` for all `public` tables/views (`relkind IN ('r', 'v')`).
   - `pg_attribute.attacl` for `public.profiles` (and `information_schema.column_privileges` for `public.profiles`).
   - `information_schema.role_table_grants` for `table_schema = 'public'`.
   - `pg_proc.proacl` for all `public` functions.
4. **Default ACLs (`pg_default_acl`):**
   - All rows in `pg_default_acl` for `defaclrole = 'postgres'::regrole` (both `defaclnamespace = 0` global and `public`) and `supabase_admin` (for reference).
5. **Migration History State:**
   - `SELECT version, name, statements FROM supabase_migrations.schema_migrations ORDER BY version;`
   - `supabase migration list` output.

### 2.2 Three-Tier Recovery Model
1. **Transaction Rollback Before `COMMIT`:**
   - [`phase6_privilege_and_profile_remediation_proposal.sql`](file:///e:/KhaiSpace/apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql) wraps Sections 1A, 1B, and 2 in `BEGIN; ... COMMIT;`. Any SQL error prior to `COMMIT` rolls back atomically with zero partial state.
2. **Compensating SQL After `COMMIT`:**
   - Possible only if the Section 2.1 snapshot was captured beforehand.
   - Must: (a) restore the exact Phase 6 `log_workspace_activity()` definition from [20261113000001_phase6_initial_schema_and_rls.sql](file:///e:/KhaiSpace/apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql#L1000-L1067), (b) drop `trg_protect_profiles_email`, `on_auth_user_email_updated`, `protect_profiles_email_immutability()`, and `sync_profile_email_from_auth()`, (c) restore every captured table, view, column, and function ACL, and (d) restore `pg_default_acl` entries.
   - **Limitation:** Compensating SQL is **not** a complete rollback unless every affected object, `proconfig`, ownership, and ACL from the pre-deployment snapshot is covered. Furthermore, `ALTER DEFAULT PRIVILEGES` rollback does not retroactively alter objects created *between* deployment and rollback.
3. **Full Database Restore / PITR:**
   - Required if compensating SQL fails, leaves partial ACL/trigger state, or if any `auth.users` / production table integrity is impacted.

---

## 3. `profiles` Direct `INSERT` Decision Analysis

### 3.1 Repository Evidence Inspected
- **Auth & Trigger Layer:** [`handle_new_user()`](file:///e:/KhaiSpace/apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql#L546-L612) (`AFTER INSERT ON auth.users`, `SECURITY DEFINER`, `ON CONFLICT (id) DO NOTHING`) automatically provisions `public.profiles` rows. Self-healing `INSERT ... ON CONFLICT (id) DO NOTHING` also exists in `create_workspace_with_owner()` and `accept_workspace_invitation()` (`SECURITY DEFINER`).
- **RLS & Grants:** `public.profiles` has policy `"Users insert own profile" FOR INSERT WITH CHECK (id = auth.uid())`, and `GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated`.
- **Frontend Usage:** Static search across `apps/hub/src/` shows **zero** `.from(...)` Supabase table queries; [`ProfileSettings`](file:///e:/KhaiSpace/apps/hub/src/components/settings/profile-settings.tsx#L15-L91) operates strictly on in-memory React state, and database persistence for Profiles/Settings is deferred to **Phase 9** ([`MIGRATION-ROADMAP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/MIGRATION-ROADMAP.md#L105-L113)).
- **Test & Remediation Alignment:** [`01_schema_catalog_validation.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/01_schema_catalog_validation.sql#L145-L167) expects 45 policies (including `"Users insert own profile"`), [`03_privilege_assertions_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/03_privilege_assertions_test.sql#L75) expects `profiles` `INSERT = true`, and the remediation proposal hardens `log_workspace_activity()` to read `auth.users.email` directly.

### 3.2 Option Comparison

| Dimension | Option A: Retain `INSERT` for `authenticated` (with safeguards) | Option B: Revoke direct `INSERT` from `authenticated` |
| :--- | :--- | :--- |
| **Security Implications** | Without a `BEFORE INSERT` safeguard, an authenticated user lacking a `profiles` row could `INSERT` an arbitrary `email` (though `handle_new_user()` normally creates the row first, `email` is `UNIQUE`, and `log_workspace_activity()` reads `auth.users`). Adding a `BEFORE INSERT` trigger enforcing `NEW.email = auth.users.email` closes this gap. | Strongest least-privilege posture: `authenticated` can never directly `INSERT` into `profiles`; all creation flows through `SECURITY DEFINER` (`handle_new_user()`, `create_workspace_with_owner()`, `accept_workspace_invitation()`). |
| **Frontend Compatibility** | Compatible with both `UPDATE` and Supabase JS `.upsert()` in Phase 9. | Compatible with `UPDATE` only; any Phase 9 `.upsert()` call on `profiles` would fail with `42501` because PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` requires `INSERT` privilege. |
| **Test Changes Required** | None if keeping current proposal; if adding a `BEFORE INSERT` safeguard, update `01` (`B4`/`B6` counts) and `02` (`POST_REMEDIATION` INSERT test). | Requires updating `03_privilege_assertions_test.sql` (`profiles` `exp_ins` -> `false`) and deciding whether to drop `"Users insert own profile"` (`01` B3: 45 -> 44 policies). |
| **Failure Modes** | Unsafeguarded `INSERT` could allow pre-populating a non-matching `profiles.email` if `handle_new_user()` were somehow bypassed. | Breaks client `.upsert()` in Phase 9; fails if a user somehow exists in `auth.users` without a `profiles` row and calls a client write before calling `create_workspace_with_owner()`/`accept_workspace_invitation()`. |

### 3.3 Current Resolution Status
**UNRESOLVED — OWNER / PHASE 9 DESIGN CONFIRMATION REQUIRED.** Because Phase 9 `settings-service.ts` is not yet implemented, repository evidence cannot establish whether Phase 9 will use `UPDATE` only or `.upsert()`. The existing remediation proposal and tests remain aligned on `profiles` `INSERT = true` (Option A baseline), with audit-log email spoofing already mitigated by `log_workspace_activity()` reading `auth.users`.

---

## 4. Corrected 10-Step Deployment Runbook

> [!CAUTION]
> **Do NOT use `supabase db push` as a shortcut to apply [`phase6_privilege_and_profile_remediation_proposal.sql`](file:///e:/KhaiSpace/apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql).** Migration history is currently drifted (`20261113000001` vs `20261113024551`), and the proposal must be reviewed, checksum-verified, and deployed only under explicit owner approval.

1. **Read-Only Target Project & Role Confirmation:** Verify target is `khai-space-hub` (`dpicdhjaabfjbvppmsxk`, never BizTrack `vzbazjzxonbkfpjljjdq`) and execution role is `postgres` (`current_user = 'postgres'`). *Stop if target or role differs.*
2. **Backup / PITR Verification:** Confirm in Supabase Dashboard that automated backups and/or PITR are active for `dpicdhjaabfjbvppmsxk`. *Stop immediately if backup coverage is unavailable or unconfirmed.*
3. **Migration-History Equivalence Verification (Read-Only):** Query `supabase_migrations.schema_migrations` for `version = '20261113024551'` and compare `statements` against `20261113000001_phase6_initial_schema_and_rls.sql`. *Stop if any SQL difference exists; keep reconciliation as a separate owner-approved step (Section 5).*
4. **Baseline Snapshot Capture:** Execute all Section 2.1 snapshot queries and record baseline row counts for `auth.users` and all 12 `public` tables.
5. **Remediation SQL Review & Checksum Verification:** Verify file integrity of [`phase6_privilege_and_profile_remediation_proposal.sql`](file:///e:/KhaiSpace/apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql):
   - **SHA-256:** `2B81841A7C540E86325984456A3A3AD014769FC2CE2F37265C6F02D810AFA537`
6. **Explicit Owner Confirmation:** Obtain explicit owner sign-off immediately before any remote write.
7. **Ordered Execution of Remediation Statements:** Execute Sections 1A, 1B, and 2 inside the single `BEGIN; ... COMMIT;` block. *Stop and roll back on any error.*
8. **Mandatory `POST_REMEDIATION` Tests (via `psql` / Supabase CLI runner, NOT MCP-filtered runner):**
   1. [`01_schema_catalog_validation.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/01_schema_catalog_validation.sql) with `v_expected_mode := 'POST_REMEDIATION'` (`PASS` required).
   2. [`03_privilege_assertions_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/03_privilege_assertions_test.sql) (`PASS` required across Sections 1–5, including PG 17 `MAINTAIN`, `pg_has_role` Section 5a, and `pg_default_acl` Sections 5b–5d).
   3. [`02_rls_and_isolation_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/02_rls_and_isolation_test.sql) with `v_expected_mode := 'POST_REMEDIATION'` — **all 5 raw `DELETE` assertions must execute and pass**, ending in `PHASE_6_1_3_ALL_TESTS_PASSED_INTENTIONAL_ROLLBACK [MODE: POST_REMEDIATION]`.
   - *Stop immediately and initiate Section 2.2 recovery if any assertion fails.*
9. **Baseline-Aware Fixture Cleanup Verification:** Run Section 1.3 checks confirming `0` test fixture rows and exact preservation of pre-test baseline/owner records.
10. **Post-Deployment Snapshot & Evidence Retention:** Capture post-deployment catalog/ACL/`pg_default_acl` state and archive test outputs and snapshots in the Phase 6 closure report.

---

## 5. Migration History Reconciliation (Separate Owner-Approved Operation)

- **Scope:** Do **not** rename migration files, run `supabase migration repair`, or edit `supabase_migrations.schema_migrations` during remediation preparation. Reconciliation is a separate owner-approved operation **only after** exact SQL equivalence between `20261113000001_phase6_initial_schema_and_rls.sql` and remote `20261113024551` is proven.
- **Option A (`supabase migration repair`) Risks:** Mutates remote `supabase_migrations.schema_migrations` metadata (`reverted 20261113024551`, `applied 20261113000001`); a partial/interrupted command can desync remote history. Preserves existing Git file paths.
- **Option B (`git mv` Local Rename) Risks:** Zero remote DB mutation, but alters Git file history (`20261113000001` -> `20261113024551`), breaks any external links/scripts/PRs referencing the old path, and requires all team clones to pull/rebase cleanly before creating new migrations.
- **Required Evidence Before Choosing:** Exact `statements` diff from `supabase_migrations.schema_migrations`, `supabase migration list` output, and confirmation that no other branches/PRs depend on the `20261113000001` path.

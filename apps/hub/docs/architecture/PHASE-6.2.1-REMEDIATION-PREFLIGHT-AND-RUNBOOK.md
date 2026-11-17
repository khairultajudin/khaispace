# Khai Space Hub — Phase 6.2.1 Remediation Preflight & Deployment Runbook

**Document Version:** 1.0.2 (Phase 6.2.1.1.1)  
**Application Target:** `apps/hub/`  
**Branch:** `feature/khai-space-hub`  
**Repository:** `khairultajudin/khaispace`  
**Supabase Project Target:** `khai-space-hub` (`dpicdhjaabfjbvppmsxk`, `ap-southeast-1`)  
**Status:** `NOT DEPLOYED — PREPARATION & DOCUMENTATION ONLY`  

> [!IMPORTANT]
> This document prepares the preflight checks, recovery snapshot requirements, `profiles` `INSERT` analysis, and deployment runbook for owner review. **It does not authorize or execute any remote database operation.**

---

## 1. Data Baseline & Baseline-Aware Test Cleanup Procedure

### 1.1 Production Baseline Correction & Execution Window
- **Prior Assumption Removed:** Earlier Phase 6 notes required `0` rows across all 12 `public` tables and `auth.users`. That assumption is **invalid** whenever an owner Auth account or legitimate workspace data exists in `dpicdhjaabfjbvppmsxk`.
- **Rule:** The existing owner `auth.users` account and any legitimate production records **must remain untouched**. Never delete, truncate, or reset production data to satisfy a test precondition, and **never automatically delete suspected test fixtures from production**.
- **Quiet Window or Disposable Clone:** Execute live validation only during a **quiet validation window** (no concurrent production writes), or use a **verified disposable database clone** if concurrent writes cannot be paused.

### 1.2 Exact Test Fixtures Created by `02_rls_and_isolation_test.sql`
[`02_rls_and_isolation_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/02_rls_and_isolation_test.sql#L20-L72) runs inside a single `DO $$ ... END $$;` block and creates ephemeral records with both deterministic and randomly generated (`gen_random_uuid()`) identifiers:
- **8 Deterministic `auth.users` / `public.profiles` UUIDs & Emails:**
  - `11111111-1111-1111-1111-111111111111` (`owner-a@example.com`)
  - `22222222-2222-2222-2222-222222222222` (`owner-b@example.com`)
  - `33333333-3333-3333-3333-333333333333` (`admin-a@example.com`)
  - `44444444-4444-4444-4444-444444444444` (`member-a@example.com`; updated to `synced-member@example.com` in `POST_REMEDIATION` mode)
  - `55555555-5555-5555-5555-555555555555` (`viewer-a@example.com`)
  - `66666666-6666-6666-6666-666666666666` (`suspended-a@example.com`)
  - `77777777-7777-7777-7777-777777777777` (`nonmember@example.com`)
  - `88888888-8888-8888-8888-888888888888` (`invited@example.com`)
- **Random / Generated-ID Test Records:**
  - `workspaces` (`ws_a`, `ws_b`), `workspace_settings` (1:1 per workspace), `workspace_members` (owner + seeded/invited members), `workspace_invitations` (`inv_id`, `inv_owner`), `projects` (`proj_a`, `proj_b`, `proj_owner`), `milestones` (`ms_a`), `tasks` (`task_a`, `task_owner`), `financial_transactions` (6 seeded rows + `tx_owner`), and `activity_logs` (`v_log_id`).
  - Because child IDs are generated dynamically at runtime, **do not rely solely on user UUIDs or workspace names** to detect every fixture; full-table primary-key sets and row fingerprints are required.

### 1.3 Baseline-Aware Cleanup Verification Procedure
1. **Discover Primary Keys from Live Catalog:** Query `pg_index` (`indisprimary = true`) for `auth.users` and all 12 `public` tables—**do not assume every table has an `id` column** (for example, `public.workspace_settings` uses `workspace_id` as its primary key).
2. **Capture Pre-Test Primary-Key Sets, Row Fingerprints & Secondary Counts:**
   - For `auth.users` and each of the 12 `public` tables, capture the full primary-key set and a canonical full-row fingerprint keyed by primary key using a stable JSON representation (`to_jsonb(row)::text`, which orders JSONB object keys deterministically).
   - Confirm hash-function availability in the target environment (`SELECT extname, extnamespace::regnamespace FROM pg_extension WHERE extname = 'pgcrypto';`) rather than silently assuming an extension:
     - When `pgcrypto` is installed in `extensions` (as in `20261113000001_phase6_initial_schema_and_rls.sql`), compute: `encode(extensions.digest(convert_to(to_jsonb(row)::text, 'UTF8'), 'sha256'), 'hex')`.
     - If `pgcrypto` is absent in a disposable clone, use PostgreSQL's built-in `encode(sha256(convert_to(to_jsonb(row)::text, 'UTF8')), 'hex')`.
   - **Do not retain unnecessary raw personal data (PII) in the evidence bundle.**
   - Record row counts as **secondary evidence only**.
   - **Stop Condition:** If a stable primary key or canonical row fingerprint cannot be generated for any table, **stop immediately** before running tests and document the additional catalog/column evidence required.
3. **Distinguish Intentional Rollback Marker from Genuine Failure:**
   - `02_rls_and_isolation_test.sql` must terminate with the exact exception message:
     `PHASE_6_1_3_ALL_TESTS_PASSED_INTENTIONAL_ROLLBACK [MODE: POST_REMEDIATION]`
   - Any other exception, PostgreSQL error, or missing marker indicates a **genuine test failure** (even if the block rolled back).
4. **Compare Pre-Test vs. Post-Test Primary-Key Sets & Row Fingerprints:**
   - Re-capture primary-key sets, canonical full-row fingerprints, and secondary row counts across `auth.users` and all 12 `public` tables.
   - Verify **zero** differences between pre-test and post-test PK sets and canonical row fingerprints for every affected table (which covers all generated workspace and child records).
   - Continue verifying `0` rows matching the 8 deterministic test user UUIDs (`11111111-...` through `88888888-...`) and their exact test emails (`*@example.com` listed in Section 1.2).
   - **Workspace Names Are Diagnostic Hints Only:** Do **not** require zero rows matching `'Workspace A'` or `'Workspace B'`—a legitimate pre-existing production workspace could use either name, and checking names alone must not trigger a false-positive cleanup failure. Use workspace names only as diagnostic hints, never as standalone proof of fixture presence or absence, and **never delete a record solely because its name matches a test fixture name**.
   - Row counts alone do **not** prove clean rollback (e.g., concurrent `+1/-1` writes or mutated baseline rows could leave counts unchanged). If any PK or fingerprint differs, **stop and investigate**; never auto-delete suspected fixtures.

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

### 3.3 Recommended Design: Option B (Pending Owner Approval)
- **Recommended Target:** **Option B — revoke direct `INSERT` on `public.profiles` from `authenticated`**, relying on `handle_new_user()` and the `SECURITY DEFINER` provisioning paths in `create_workspace_with_owner()` and `accept_workspace_invitation()`.
- **Why Option B Is Supported by Repository Evidence:**
  - `handle_new_user()`, `create_workspace_with_owner()`, and `accept_workspace_invitation()` already provision `public.profiles` rows as `postgres` (`SECURITY DEFINER`).
  - Current frontend [`ProfileSettings`](file:///e:/KhaiSpace/apps/hub/src/components/settings/profile-settings.tsx#L15-L91) remains in-memory, no `.from(...)` Supabase table-write calls exist in `apps/hub/src/`, and Phase 9 profile persistence is not yet implemented.
  - The current `id = auth.uid()` `INSERT` RLS policy does not independently guarantee that an inserted `email` matches authoritative `auth.users.email`.
- **Phase 9 Implementation Rules Under Option B:**
  - Phase 9 must use **`UPDATE`-only** profile persistence.
  - Do **not** use client-side `.upsert()` for `profiles` under Option B.
  - If a profile is missing, use a trusted provisioning or repair path (`SECURITY DEFINER`) and surface a controlled error; do **not** silently fall back to client `INSERT`.
- **Approval Gate:** Option B is a recommendation only and requires **explicit owner approval** before any SQL or test changes are made.

### 3.4 Required Future SQL & Test Alignment (Before Deployment)
- **If Option B Is Approved:**
  1. Revoke `INSERT` on `public.profiles` from `authenticated` in the remediation SQL.
  2. Remove the now-unusable `"Users insert own profile"` RLS policy (if approved by owner).
  3. Update [`03_privilege_assertions_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/03_privilege_assertions_test.sql#L75) to expect `profiles INSERT = false`.
  4. Update [`01_schema_catalog_validation.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/01_schema_catalog_validation.sql#L145-L167) policy count (`45` -> `44`) and exact policy inventory.
  5. Update [`02_rls_and_isolation_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/02_rls_and_isolation_test.sql) to prove client `INSERT` is denied (`42501`) while `auth.users` trigger and trusted RPC profile provisioning still succeed.
  6. Add a Phase 9 acceptance criterion prohibiting client `.upsert()` on `profiles` unless a separately reviewed design reintroduces direct `INSERT`.
- **If Option A Is Chosen Instead:**
  - The current remediation proposal is **insufficient** as written: it must add a `BEFORE INSERT` guard verifying `NEW.email` matches authoritative `auth.users.email` (and identity fields), plus tests in `02_rls_and_isolation_test.sql` covering spoofed-email `INSERT` rejection and missing-profile handling.

---

## 4. Corrected 10-Step Deployment Runbook

> [!CAUTION]
> **Do NOT use `supabase db push` as a shortcut to apply [`phase6_privilege_and_profile_remediation_proposal.sql`](file:///e:/KhaiSpace/apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql).** Migration history is currently drifted (`20261113000001` vs `20261113024551`), and the proposal must be reviewed, checksum-verified, and deployed only under explicit owner approval.

1. **Read-Only Target Project & Role Confirmation:** Verify target is `khai-space-hub` (`dpicdhjaabfjbvppmsxk`, never BizTrack `vzbazjzxonbkfpjljjdq`) and execution role is `postgres` (`current_user = 'postgres'`). *Stop if target or role differs.*
2. **Backup / PITR Verification:** Confirm in Supabase Dashboard that automated backups and/or PITR are active for `dpicdhjaabfjbvppmsxk`. *Stop immediately if backup coverage is unavailable or unconfirmed.*
3. **Migration-History Equivalence Verification (Read-Only):** Query `supabase_migrations.schema_migrations` for `version = '20261113024551'` and compare `statements` against `20261113000001_phase6_initial_schema_and_rls.sql`. *Stop if any SQL difference exists; keep reconciliation as a separate owner-approved step (Section 5).*
4. **Baseline Snapshot Capture:** Execute all Section 2.1 snapshot queries and record pre-test PK sets, canonical full-row fingerprints, and secondary row counts for `auth.users` and all 12 `public` tables (Section 1.3). *Stop if any table lacks a stable PK or fingerprint.*
5. **Remediation SQL Review & Checksum Verification:** Verify file integrity of [`phase6_privilege_and_profile_remediation_proposal.sql`](file:///e:/KhaiSpace/apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql):
   - **SHA-256:** `2B81841A7C540E86325984456A3A3AD014769FC2CE2F37265C6F02D810AFA537`
6. **Explicit Owner Confirmation:** Obtain explicit owner sign-off immediately before any remote write.
7. **Ordered Execution of Remediation Statements:** Execute Sections 1A, 1B, and 2 inside the single `BEGIN; ... COMMIT;` block. *Stop and roll back on any error.*
8. **Mandatory `POST_REMEDIATION` Tests (via `psql` / Supabase CLI runner, NOT MCP-filtered runner):**
   1. [`01_schema_catalog_validation.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/01_schema_catalog_validation.sql) with `v_expected_mode := 'POST_REMEDIATION'` (`PASS` required).
   2. [`03_privilege_assertions_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/03_privilege_assertions_test.sql) (`PASS` required across Sections 1–5, including PG 17 `MAINTAIN`, `pg_has_role` Section 5a, and `pg_default_acl` Sections 5b–5d).
   3. [`02_rls_and_isolation_test.sql`](file:///e:/KhaiSpace/apps/hub/supabase/tests/02_rls_and_isolation_test.sql) with `v_expected_mode := 'POST_REMEDIATION'` — **all 5 raw `DELETE` assertions must execute and pass**, ending in `PHASE_6_1_3_ALL_TESTS_PASSED_INTENTIONAL_ROLLBACK [MODE: POST_REMEDIATION]`.
   - *Stop immediately and initiate Section 2.2 recovery if any assertion fails.*
9. **Baseline-Aware Fixture Cleanup Verification:** Run Section 1.3 checks confirming identical pre/post PK sets and row fingerprints across `auth.users` and all 12 `public` tables, `0` test fixture rows, and unchanged baseline/owner records.
10. **Post-Deployment Snapshot & Evidence Retention:** Capture post-deployment catalog/ACL/`pg_default_acl` state and archive test outputs and snapshots in the Phase 6 closure report.

---

## 5. Migration History Reconciliation (Separate Owner-Approved Operation)

- **Scope:** Do **not** rename migration files, run `supabase migration repair`, or edit `supabase_migrations.schema_migrations` during remediation preparation. Reconciliation is a separate owner-approved operation **only after** exact SQL equivalence between `20261113000001_phase6_initial_schema_and_rls.sql` and remote `20261113024551` is proven.
- **Option A (`supabase migration repair`) Risks:** Mutates remote `supabase_migrations.schema_migrations` metadata (`reverted 20261113024551`, `applied 20261113000001`); a partial/interrupted command can desync remote history. Preserves existing Git file paths.
- **Option B (`git mv` Local Rename) Risks:** Zero remote DB mutation, but alters Git file history (`20261113000001` -> `20261113024551`), breaks any external links/scripts/PRs referencing the old path, and requires all team clones to pull/rebase cleanly before creating new migrations.
- **Required Evidence Before Choosing:** Exact `statements` diff from `supabase_migrations.schema_migrations`, `supabase migration list` output, and confirmation that no other branches/PRs depend on the `20261113000001` path.


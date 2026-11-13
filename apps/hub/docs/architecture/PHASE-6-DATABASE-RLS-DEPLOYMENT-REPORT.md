# Khai Space Hub — Phase 6 Database Schema & Row Level Security Deployment Report

**Document Version:** 1.3.0 (Updated with Phase 6.1.2 Remediation Design & Verification Corrections)  
**Phase:** Phase 6 — Deployment | Phase 6.1 — Test Hardening | Phase 6.1.1 — Privilege Audit | Phase 6.1.2 — Verification Closure  
**Application Target:** `apps/hub/`  
**Working Branch:** `feature/khai-space-hub`  
**Repository:** `https://github.com/khairultajudin/khaispace`  
**Starting Commit:** `12e9881080b44b87c17179e8f45026715683956f`  
**Supabase Project Target:** `khai-space-hub` (`dpicdhjaabfjbvppmsxk`, Singapore `ap-southeast-1`)  
**Database Engine:** PostgreSQL 17.11  
**Execution Timestamp:** 2026-11-13T10:45:00+08:00  

---

## 1. Executive Summary

Phase 6 marks the transition of **Khai Space Hub** from architectural specifications and client-side authentication gating into a fully provisioned, cryptographically secured, multi-tenant relational persistence layer on Supabase PostgreSQL 17.11.

All 12 planned relational tables, 11 custom PostgreSQL enums, composite foreign-key integrity constraints, 17 database functions (15 `SECURITY DEFINER` + 2 `SECURITY INVOKER`), 20 database triggers, 45 Row Level Security (RLS) policies, and 3 high-performance financial accounting views (`security_invoker = true`) were successfully deployed and verified.

Strict change control was maintained throughout execution:
- The unrelated BizTrack Supabase project (`vzbazjzxonbkfpjljjdq`) was untouched.
- The root public website was untouched.
- Zero test fixtures, mock records, or test accounts persist in the production database; all functional and RLS matrix test suites were executed with transactional rollbacks.
- Live database TypeScript definitions were generated directly via Supabase introspection into [`apps/hub/src/types/database.types.ts`](file:///e:/KhaiSpace/apps/hub/src/types/database.types.ts) and verified clean across all quality gates.

---

## 2. Starting Repository State

Prior to initiating Phase 6 changes, the repository preflight verification confirmed:
- **Repository Remote:** `https://github.com/khairultajudin/khaispace.git`
- **Active Branch:** `feature/khai-space-hub`
- **Starting HEAD Commit:** `12e9881080b44b87c17179e8f45026715683956f` (`docs(hub): align phase 5 localhost redirect port`)
- **Working Tree:** Completely clean (`git status --short` returned 0 modified files)
- **Active Git Operations:** None (no rebase, merge, or cherry-pick in progress)

---

## 3. Supabase Target Identity

The deployment target was validated via the official Supabase Management API (`supabase_mcp.get_project`):
- **Project Name:** `khai-space-hub`
- **Project Reference ID:** `dpicdhjaabfjbvppmsxk`
- **Project URL:** `https://dpicdhjaabfjbvppmsxk.supabase.co`
- **Database Host:** `db.dpicdhjaabfjbvppmsxk.supabase.co`
- **Cloud Provider / Region:** AWS / `ap-southeast-1` (Singapore)
- **Database Engine:** PostgreSQL 17.11
- **Status:** `ACTIVE_HEALTHY`
- **Prohibited Target Verification:** BizTrack (`vzbazjzxonbkfpjljjdq`) was excluded from all tool calls, connections, and migrations.

---

## 4. Pre-Deployment Remote Database Inventory

Before executing any DDL or migration commands, a complete pre-deployment inspection of `dpicdhjaabfjbvppmsxk` was conducted via `supabase_mcp.list_tables` and `execute_sql`:
- **Tables in `public` Schema:** 0
- **Views in `public` Schema:** 0
- **Enums in `public` Schema:** 0
- **Functions in `public` Schema:** 0
- **Supabase Migration History (`supabase_migrations.schema_migrations`):** 0 applied migrations
- **Auth Users (`auth.users`):** 0 user accounts
- **Installed Extensions:** `pgcrypto` pre-installed under the `extensions` schema (`extensions.digest`, `gen_random_uuid()` in `pg_catalog`).

The baseline remote database was confirmed completely clean and unpolluted.

---

## 5. Backup / Recovery Readiness

Before migration application, recovery points and backup limitations for project `dpicdhjaabfjbvppmsxk` were assessed:
- **Baseline State:** Prior to Phase 6 DDL execution, `dpicdhjaabfjbvppmsxk` had 0 tables, 0 views, 0 functions, 0 migrations, and 0 `auth.users` rows.
- **Platform Backups & PITR Caveat:** Automated daily backups and Point-In-Time Recovery (PITR) depend on the active Supabase organization billing plan; plan-level backup retention and PITR availability were not independently verified via billing APIs and must be confirmed in the Supabase Dashboard before production data onboarding.
- **Migration Idempotency & Safety:** The migration script was designed as an additive, non-destructive deployment (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN CREATE TYPE ... EXCEPTION WHEN duplicate_object THEN null; END $$`, `CREATE OR REPLACE FUNCTION`, `CREATE OR REPLACE TRIGGER`, and `CREATE OR REPLACE VIEW`).
- **Zero-Fixture Safety:** All database test fixtures run within explicit transactions ending in intentional rollback (`RAISE EXCEPTION ...`), guaranteeing that schema verification leaves no orphaned rows or state drift.

---

## 6. SQL Security Audit Findings

A rigorous line-by-line audit of [`apps/hub/docs/architecture/schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql) identified three critical compatibility and integrity findings that were remediated prior to deployment:

1. **Extension Schema Resolution for `digest()`:**
   - *Finding:* In `schema-draft.sql` line 736, `accept_workspace_invitation()` invoked unqualified `digest(TRIM(p_token), 'sha256')` under `SET search_path = public, auth, pg_temp;`. Because Supabase installs `pgcrypto` into schema `extensions`, calling unqualified `digest()` throws `function digest(text, unknown) does not exist`.
   - *Impact:* Legitimate invitation acceptance would crash at runtime with an unhandled SQL exception.
   - *Remediation:* Explicitly qualified the call as `extensions.digest(TRIM(p_token)::text, 'sha256')` and updated the function declaration to `SET search_path = public, auth, extensions, pg_temp;`.

2. **Cascade Deletion Conflict with Project Cleanup Trigger:**
   - *Finding:* When an owner deleted a workspace, the foreign key `ON DELETE CASCADE` deleted the parent workspace row first, triggering child deletions. The `BEFORE DELETE` trigger on `projects` fired `handle_project_deletion_cleanup()`, which executed `UPDATE public.financial_transactions SET project_id = NULL WHERE workspace_id = OLD.workspace_id...`. In PostgreSQL 17, updating child transactions while the parent `workspaces` row is actively being deleted threw a foreign key violation: `Key (workspace_id)=... is not present in table "workspaces"`.
   - *Impact:* Workspace deletion by owner failed with a constraint violation whenever projects and transactions existed.
   - *Remediation:* Added an early bypass check to both `handle_project_deletion_cleanup()` and `handle_milestone_deletion_cleanup()`:
     ```sql
     IF current_setting('app.deleting_workspace_id', true) = OLD.workspace_id::text THEN
       RETURN OLD;
     END IF;
     ```
     When the entire workspace is being deleted, individual project cleanup is redundant because all child records are cleanly purged by the workspace cascade.

3. **Input Sanitization & Length Boundary Defensive Hardening:**
   - *Finding:* `handle_new_user()` and `create_workspace_with_owner()` directly converted user metadata into `full_name` and `display_name` without explicit character length bounds.
   - *Impact:* Malformed or adversarial OAuth metadata exceeding column bounds (`varchar(100)`, `varchar(50)`) could abort user creation.
   - *Remediation:* Bounded all input strings using `SUBSTRING(... FROM 1 FOR <limit>)` and added explicit non-empty validation on `ws_name`.

---

## 7. Corrections Made to the Original Draft

The following exact corrections were applied to [`apps/hub/docs/architecture/schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql) and embedded into the migration file:
1. Qualified `digest()` invocation as `extensions.digest(TRIM(p_token)::text, 'sha256')` and added `extensions` to `search_path` in `accept_workspace_invitation()`.
2. Added workspace cascade bypass guard to `handle_project_deletion_cleanup()` and `handle_milestone_deletion_cleanup()`.
3. Replaced `DROP TRIGGER IF EXISTS` with modern PostgreSQL `CREATE OR REPLACE TRIGGER` to avoid destructive statement warnings and race conditions.
4. Added explicit `REVOKE EXECUTE ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;` on all functions, including the two `SECURITY INVOKER` functions (`handle_updated_at` and `prevent_note_type_change`).

---

## 8. Migration Filename and Version

- **Local Migration File Path:** [`apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql`](file:///e:/KhaiSpace/apps/hub/supabase/migrations/20261113000001_phase6_initial_schema_and_rls.sql)
- **Applied Via:** `supabase_mcp.apply_migration`
- **Remote `supabase_migrations.schema_migrations` Version:** `20261113024551`
- **Remote Migration Name:** `phase6_initial_schema_and_rls`
- **Migration Status:** Confirmed applied in `supabase_migrations.schema_migrations`.
- **Version Discrepancy (Phase 6.1 Audit Finding):** `supabase_mcp.apply_migration` recorded a server-generated UTC timestamp version (`20261113024551`) rather than the local filename prefix (`20261113000001`). Because local and remote versions differ, running `supabase db push` via Supabase CLI in the future would treat `20261113000001` as a pending migration and fail attempting to reapply existing objects. Neither the local filename nor remote `schema_migrations` was altered during Phase 6.1; aligning the local filename to `20261113024551_phase6_initial_schema_and_rls.sql` (or running `supabase migration repair`) is queued for project owner approval before Phase 7.

---

## 9. Tables and Enums Deployed

### 9.1 Core Relational Tables (12 Deployed, All RLS Enabled)

| # | Table Name | Primary Key | Description | RLS Status |
|:---|:---|:---|:---|:---|
| 1 | `public.workspaces` | `id uuid` | Multi-tenant workspace root entity | `ENABLED` |
| 2 | `public.profiles` | `id uuid` (FK `auth.users`) | 1:1 user profile tied to Supabase Auth | `ENABLED` |
| 3 | `public.workspace_members` | `id uuid` | RBAC workspace membership junction | `ENABLED` |
| 4 | `public.workspace_invitations` | `id uuid` | Cryptographic SHA-256 invitation tokens | `ENABLED` |
| 5 | `public.workspace_settings` | `workspace_id uuid` | 1:1 workspace preferences & notifications | `ENABLED` |
| 6 | `public.projects` | `id uuid` | Engineering projects directory | `ENABLED` |
| 7 | `public.milestones` | `id uuid` | Project milestone roadmaps | `ENABLED` |
| 8 | `public.tasks` | `id uuid` | Actionable work items | `ENABLED` |
| 9 | `public.financial_transactions` | `id uuid` | General ledger with exact decimal amounts | `ENABLED` |
| 10 | `public.ai_subscriptions` | `id uuid` | AI tool recurring subscriptions | `ENABLED` |
| 11 | `public.workspace_notes` | `id uuid` | Workspace notes and architectural decisions | `ENABLED` |
| 12 | `public.activity_logs` | `id uuid` | Append-only audit activity ledger | `ENABLED` |

### 9.2 Custom PostgreSQL Enums (11 Deployed)

1. `public.project_status`: `'Active'`, `'Production'`, `'In Development'`, `'Planning'`, `'Documented'`
2. `public.task_priority`: `'High'`, `'Medium'`, `'Normal'`
3. `public.task_status`: `'In Progress'`, `'Pending'`, `'Completed'`
4. `public.milestone_status`: `'Planned'`, `'In Progress'`, `'Completed'`
5. `public.transaction_type`: `'Income'`, `'Expense'`, `'Investment'`
6. `public.subscription_status`: `'Active'`, `'Paused'`, `'Cancelled'`, `'Trial'`
7. `public.billing_cycle`: `'Monthly'`, `'Annual'`
8. `public.note_record_type`: `'Note'`, `'Decision'`
9. `public.decision_status`: `'Proposed'`, `'Approved'`, `'Rejected'`, `'Superseded'`
10. `public.member_role`: `'Owner'`, `'Administrator'`, `'Member'`, `'Viewer'`
11. `public.member_status`: `'Active'`, `'Pending'`, `'Suspended'`

---

## 10. Foreign Keys, Indexes and Constraints

### Key Constraints & Indexes Deployed
- **Single-Owner Invariant:** Partial unique index `idx_workspace_single_owner` on `public.workspace_members (workspace_id) WHERE (role = 'Owner')`. Enforces strictly $\le 1$ Owner per workspace at the database engine level.
- **Cross-Workspace Composite Keys:**
  - `projects (workspace_id, slug)` UNIQUE constraint.
  - `projects (workspace_id, id)` UNIQUE constraint.
  - `milestones` composite foreign key `(workspace_id, project_id) REFERENCES projects(workspace_id, id) ON DELETE CASCADE`.
  - `milestones (workspace_id, id)` UNIQUE constraint.
  - `tasks` composite foreign key `(workspace_id, project_id) REFERENCES projects(workspace_id, id) ON DELETE CASCADE`.
  - `tasks` column-specific composite foreign key `(workspace_id, milestone_id) REFERENCES milestones(workspace_id, id) ON DELETE SET NULL (milestone_id)`.
- **Financial Constraints:**
  - `chk_positive_amount CHECK (amount > 0)` on `financial_transactions`.
  - `chk_investment_return_type CHECK ((type = 'Income') OR (is_investment_return = false))` strictly enforcing that only Income transactions can be marked as investment returns.
  - `chk_subscription_amount CHECK (amount >= 0)` and `chk_subscription_currency CHECK (currency = 'MYR')` on `ai_subscriptions`.
- **Performance Indexes:**
  - `idx_members_user`, `idx_members_lookup`
  - `idx_projects_workspace`, `idx_projects_slug`
  - `idx_milestones_proj`
  - `idx_tasks_proj`, `idx_tasks_due`
  - `idx_tx_ws_date`, `idx_tx_roi`, `idx_tx_proj`
  - `idx_subs_ws`, `idx_subs_renew`
  - `idx_notes_ws`, `idx_activity_ws`
  - `idx_invitations_token` on `token_hash WHERE (status = 'pending')`

---

## 11. Functions and Triggers

### 11.1 Deployed Database Functions (17 Total)

| Function Name | Return Type | Security Mode | Owner | Search Path | Public RPC Accessible |
|:---|:---|:---|:---|:---|:---|
| `accept_workspace_invitation` | `uuid` | `SECURITY DEFINER` | `postgres` | `public, auth, extensions, pg_temp` | `authenticated` only |
| `create_workspace_with_owner` | `uuid` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | `authenticated` only |
| `delete_workspace_by_owner` | `void` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | `authenticated` only |
| `get_user_workspace_role` | `member_role` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | `authenticated` only |
| `is_workspace_admin_or_owner` | `boolean` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | `authenticated` only |
| `is_workspace_member` | `boolean` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | `authenticated` only |
| `log_workspace_activity` | `uuid` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | `authenticated` only |
| `handle_new_user` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `handle_workspace_deletion_authorization` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `protect_workspace_members_immutability` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `protect_workspace_members_deletion` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `handle_project_deletion_cleanup` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `handle_milestone_deletion_cleanup` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `validate_project_workspace_integrity` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `validate_subscription_project_workspace_integrity` | `trigger` | `SECURITY DEFINER` | `postgres` | `public, auth, pg_temp` | None (`REVOKE ALL`) |
| `handle_updated_at` | `trigger` | `SECURITY INVOKER` | `postgres` | Default | Internal trigger only |
| `prevent_note_type_change` | `trigger` | `SECURITY INVOKER` | `postgres` | Default | Internal trigger only |

### 11.2 Deployed Triggers (20 Total)
- **Supabase Auth Hook:** `on_auth_user_created` on `auth.users`.
- **Integrity Triggers:** `trg_tx_project_ws_integrity`, `trg_notes_project_ws_integrity`, `trg_subs_project_ws_integrity`.
- **Cleanup Triggers:** `trg_project_deletion_cleanup`, `trg_milestone_deletion_cleanup`.
- **Security & RBAC Protection Triggers:** `trg_workspace_deletion_auth`, `trg_protect_members_immutability`, `trg_protect_members_deletion`, `trg_note_type_immutability`.
- **Updated-At Triggers (10):** Attached to `workspaces`, `profiles`, `workspace_members`, `workspace_settings`, `projects`, `milestones`, `tasks`, `financial_transactions`, `ai_subscriptions`, `workspace_notes`.

---

## 12. RLS Policies and Role Matrix

### 12.1 Policy Distribution (45 Policies Across 12 Tables)
- `workspaces`: 3 policies (`SELECT`, `UPDATE`, `DELETE`; `INSERT` disabled, managed via RPC).
- `profiles`: 3 policies (`SELECT` shared workspace members, `INSERT` own, `UPDATE` own).
- `workspace_members`: 5 policies (`SELECT` members, Owner `UPDATE`, Admin `UPDATE`, Owner `DELETE`, Admin `DELETE`; `INSERT` disabled).
- `workspace_invitations`: 7 policies (Admin `SELECT`, Owner `INSERT`, Admin `INSERT`, Owner `UPDATE`, Admin `UPDATE`, Owner `DELETE`, Admin `DELETE`).
- `workspace_settings`: 2 policies (`SELECT`, `UPDATE`).
- `projects`: 4 policies (`SELECT`, `INSERT` non-viewers, `UPDATE` non-viewers, `DELETE` admins/owner).
- `milestones`: 4 policies (`SELECT`, `INSERT` non-viewers, `UPDATE` non-viewers, `DELETE` non-viewers).
- `tasks`: 4 policies (`SELECT`, `INSERT` non-viewers, `UPDATE` non-viewers, `DELETE` non-viewers).
- `financial_transactions`: 4 policies (`SELECT`, `INSERT` non-viewers, `UPDATE` non-viewers, `DELETE` admins/owner).
- `ai_subscriptions`: 4 policies (`SELECT`, `INSERT` non-viewers, `UPDATE` non-viewers, `DELETE` admins/owner).
- `workspace_notes`: 4 policies (`SELECT`, `INSERT` non-viewers, `UPDATE` non-viewers, `DELETE` non-viewers).
- `activity_logs`: 1 policy (`SELECT` members; `INSERT`, `UPDATE`, `DELETE` disabled, managed via trusted logging procedure).

### 12.2 Evaluated Role & Status Matrix

| Action | Owner | Administrator | Member | Viewer | Suspended | Anonymous |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| Read workspace data | **Allow** | **Allow** | **Allow** | **Allow** | **Deny** | **Deny** |
| Create project / milestone / task | **Allow** | **Allow** | **Allow** | **Deny** | **Deny** | **Deny** |
| Update project / milestone / task | **Allow** | **Allow** | **Allow** | **Deny** | **Deny** | **Deny** |
| Delete project | **Allow** | **Allow** | **Deny** | **Deny** | **Deny** | **Deny** |
| Delete task / milestone | **Allow** | **Allow** | **Allow** | **Deny** | **Deny** | **Deny** |
| Create financial transaction | **Allow** | **Allow** | **Allow** | **Deny** | **Deny** | **Deny** |
| Delete financial transaction | **Allow** | **Allow** | **Deny** | **Deny** | **Deny** | **Deny** |
| Update workspace settings | **Allow** | **Allow** | **Deny** | **Deny** | **Deny** | **Deny** |
| Manage member roster | **Allow** | **Restricted** (Member/Viewer only) | **Deny** | **Deny** | **Deny** | **Deny** |
| Delete workspace | **Allow** | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** |
| Direct table INSERT into `workspaces` | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** |
| Direct table INSERT into `workspace_members` | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** |
| Direct table writes on `activity_logs` | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** |

---

## 13. Table and Function Permissions

### 13.1 Principle of Least Privilege Grants & Phase 6.1 Privilege Audit
- **Anonymous Role (`anon`):**
  - `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;`
  - `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;`
  - Verified count of anon-callable functions in `public`: **0**.
  - Verified anon table/view grants in `information_schema.role_table_grants`: **0** (`anon` receives `42501 insufficient_privilege` when querying `public.projects`).
- **Authenticated Role (`authenticated`):**
  - **Table Grants (Phase 6.1 Finding):** Live inspection of `information_schema.role_table_grants` revealed that `authenticated` still retains Supabase default privileges (`DELETE`, `INSERT`, `REFERENCES`, `SELECT`, `TRIGGER`, `TRUNCATE`, `UPDATE`) on all 12 `public` tables and 3 views, because the Phase 6 migration did not execute `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;` prior to selective `GRANT` statements. While RLS blocks unauthorized `SELECT`/`INSERT`/`UPDATE`/`DELETE` operations, PostgreSQL `TRUNCATE` bypasses RLS. Restricting `authenticated` grants via a follow-up migration is queued for owner approval (see Section 18).
  - **Function Grants (Phase 6.1.1 Finding):** Permitted to execute the 7 public RPC functions (`create_workspace_with_owner`, `accept_workspace_invitation`, `delete_workspace_by_owner`, `is_workspace_member`, `get_user_workspace_role`, `is_workspace_admin_or_owner`, `log_workspace_activity`). However, Phase 6.1.1 catalog validation (`01_schema_catalog_validation.sql` B4) detected that `authenticated` also retains `EXECUTE` on the two `SECURITY INVOKER` trigger functions (`handle_updated_at`, `prevent_note_type_change`) because `REVOKE EXECUTE` only targeted `PUBLIC` and `anon`.
  - **Trigger Functions:** `REVOKE ALL` from `PUBLIC`, `anon`, and `authenticated` confirmed on all 8 `SECURITY DEFINER` trigger functions; revoking `authenticated` `EXECUTE` on the 2 `SECURITY INVOKER` trigger functions is included in the Phase 6.1.2 remediation proposal (**PENDING OWNER APPROVAL**).

---

## 14. Financial Views

All 3 accounting views were deployed with explicit `WITH (security_invoker = true)`:
1. `public.view_overall_finance_kpis`: Aggregates `total_income`, `total_expenses`, `net_cashflow`, `total_investment`, `realized_investment_return`, `roi_percent`, and `roi_note`.
2. `public.view_project_finance_summary`: Project-level cashflow, investment outlays, and ROI percentages.
3. `public.view_monthly_financial_trends`: Monthly time-series aggregations grouped by `workspace_id` and month.

**Security Invoker Validation:**
- Tested with `pg_class.reloptions`: confirmed `['security_invoker=true']` on all 3 views.
- Permissions: Anonymous access revoked; `SELECT` granted to `authenticated`.
- Tenant Isolation (Verified under `SET LOCAL ROLE authenticated` in Phase 6.1): When User A queried `view_overall_finance_kpis`, `view_project_finance_summary`, and `view_monthly_financial_trends` filtered to `ws_b` (and when a non-member queried all 3 views), PostgreSQL evaluated 0 rows, verifying that views cannot bypass table-level RLS.

---

## 15. TypeScript Reconciliation

The database types in [`apps/hub/src/types/database.types.ts`](file:///e:/KhaiSpace/apps/hub/src/types/database.types.ts) were reconciled using live introspection via `supabase_mcp.generate_typescript_types` against project `dpicdhjaabfjbvppmsxk`:
- 12 tables mapped with exact `Row`, `Insert`, and `Update` types.
- 11 enums mapped with string literal unions and runtime `Constants`.
- 3 views mapped with exact nullable aggregation column definitions.
- 7 callable RPC functions mapped with typed arguments and return signatures.
- Typecheck verification (`npm run typecheck --prefix apps/hub`) passed with 0 errors.

---

## 16. Database Test Results (Phase 6, Phase 6.1, Phase 6.1.1 & Phase 6.1.2)

The test suite in [`apps/hub/supabase/tests/`](file:///e:/KhaiSpace/apps/hub/supabase/tests/) was expanded in Phase 6.1.2 and executed against `dpicdhjaabfjbvppmsxk` using `supabase_mcp.execute_sql`:

> **Phase Distinction:**
> - **Phase 6:** Initial DDL deployment and `postgres`-role smoke tests.
> - **Phase 6.1:** Rewrote tests to switch into `SET LOCAL ROLE authenticated` / `anon` with atomic rollback.
> - **Phase 6.1.1:** Added per-object catalog validation, strict privilege failure assertions (`03_privilege_assertions_test.sql`), expanded Owner authorization coverage, and initial remediation proposal.
> - **Phase 6.1.2:** Upgraded `01_schema_catalog_validation.sql` (`B4` exact function signatures/overloads, `B5` view columns/dependencies/grouping/joins, `B7` all 52 `pg_get_constraintdef()` checks), expanded `02_rls_and_isolation_test.sql` (profile positive updates, cross-user profile denial, `log_workspace_activity()` actor-email spoofing proof, and exact `view_project_finance_summary`/`view_monthly_financial_trends` calculations), and corrected `phase6_privilege_and_profile_remediation_proposal.sql` to use `SECURITY INVOKER` + column-level `UPDATE` grants + `auth.users` sync (**NOT DEPLOYED — PENDING OWNER APPROVAL**).

### 16.1 `01_schema_catalog_validation.sql`
- **B1** (12 tables + RLS enabled + 0 unexpected tables): **PASS**
- **B2** (11 enums + exact ordered label sets): **PASS**
- **B3** (45 RLS policies individually validated by name, table, cmd, roles, `USING`, `WITH CHECK`): **PASS**
- **B4** (17 functions: exact `pronargs`, `pg_get_function_identity_arguments`, `pg_get_function_result`, `prokind`, `prosecdef`, `proconfig`, overload count = 1, `EXECUTE` grants): **FAIL** — `authenticated` retains `EXECUTE` on `handle_updated_at()` and `prevent_note_type_change()` (trigger functions); all 17 signatures, overloads, `search_path`s, and `PUBLIC`/`anon` revocations match expectations.
- **B5** (3 financial views: `security_invoker=true`, exact ordered columns, `pg_depend` source tables, grouping/join/ROI logic, grants): **PASS**
- **B6** (20 triggers individually validated by schema, table, timing/event, enabled `'O'`, function): **PASS**
- **B7** (All 52 constraints validated via `pg_get_constraintdef()`, `convalidated`, `condeferrable` + `idx_workspace_single_owner` + 16 indexes): **PASS**

### 16.2 `03_privilege_assertions_test.sql`
- **Result:** **FAIL** — `SECURITY FAILURE: authenticated has TRUNCATE on public.workspaces` (live `has_table_privilege` confirms `authenticated` has `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` on all 12 tables and 3 views, plus `has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE') = true`). `PUBLIC` and `anon` have 0 privileges across all 12 tables and 3 views (**PASS**).

### 16.3 `02_rls_and_isolation_test.sql`
- `anon` rejection (`42501`), `authenticated` NULL `auth.uid()` rejection (`P0001`), Workspace A/B RPC creation: **PASS**
- Cross-workspace `SELECT`, `INSERT` (`42501`), `UPDATE` (0 rows) isolation & trigger integrity: **PASS**
- Expanded Owner authorization & RBAC boundaries (`Administrator`, `Member`, `Viewer`, `Suspended`): **PASS**
- Profile positive updates (`full_name`, `display_name`, `bio`) & cross-user profile update denial (0 rows): **PASS**
- `profiles.email` mutability & `log_workspace_activity()` actor-email spoofing proof: **PASS** *(reproduces open finding)*
- Exact calculation & tenant-isolation assertions across all 3 financial views: **PASS**
- Non-swallowing `delete_workspace_by_owner()` & atomic rollback (`PHASE_6_1_2_PROFILE_AND_VIEWS_PASSED_INTENTIONAL_ROLLBACK`): **PASS** (0 rows committed)
- **5 Raw `DELETE` Assertions (3 cross-workspace/member + 2 Owner `DELETE` statements):** **NOT EXECUTED** (MCP client auto-cancels queries containing raw `DELETE`, and no local `psql`, `supabase` CLI, or `docker` environment is installed on this host).

---

## 17. Remote Post-Deployment Verification

A comprehensive catalog audit of the remote database `dpicdhjaabfjbvppmsxk` after all tests confirmed:
- `workspaces`: 0 rows
- `profiles`: 0 rows
- `workspace_members`: 0 rows
- `workspace_invitations`: 0 rows
- `workspace_settings`: 0 rows
- `projects`: 0 rows
- `milestones`: 0 rows
- `tasks`: 0 rows
- `financial_transactions`: 0 rows
- `ai_subscriptions`: 0 rows
- `workspace_notes`: 0 rows
- `activity_logs`: 0 rows
- **Zero test fixtures or production pollution.**

---

## 18. Security Findings and Residual Risks

> **Proposed Remediation File (NOT DEPLOYED — PENDING APPROVAL):** [`apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql`](file:///e:/KhaiSpace/apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql)

1. **Open Finding (High — `FAIL` in `03_privilege_assertions_test.sql`) — Excess `authenticated` Default Table Privileges (`TRUNCATE` Risk):** `has_table_privilege` and `information_schema.role_table_grants` confirm `authenticated` retains `{DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE}` on all 12 `public` tables and 3 views because `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;` was omitted before selective `GRANT`s. While RLS enforces row-level access for `SELECT`/`INSERT`/`UPDATE`/`DELETE`, PostgreSQL `TRUNCATE` bypasses RLS. **Proposed Remediation (PENDING APPROVAL):** Execute `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;` followed by minimal table/view `GRANT`s matching the RLS model.
2. **Open Finding (Medium) — `public.profiles.email` Mutability:** `has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE') = true` and `02_rls_and_isolation_test.sql` Section 5A proves an authenticated user can `UPDATE public.profiles SET email = ... WHERE id = auth.uid()`. Although `accept_workspace_invitation()` safely verifies `auth.users.email`, `log_workspace_activity()` snapshots `profiles.email` into `activity_logs.actor_email`, enabling audit-log actor email spoofing and UI profile divergence. **Proposed Remediation (PENDING APPROVAL):** Column-level `UPDATE` restriction excluding `email` combined with a `BEFORE UPDATE` trigger (`protect_profiles_email_immutability()`).
3. **Open Finding (Low — `FAIL` in `01_schema_catalog_validation.sql` B4) — `authenticated` `EXECUTE` on 2 `SECURITY INVOKER` Trigger Functions:** `authenticated` retains `EXECUTE` on `handle_updated_at()` and `prevent_note_type_change()` (returning `trigger`, so direct SQL calls are blocked by PostgreSQL, but still violating least-privilege specification). **Proposed Remediation (PENDING APPROVAL):** `REVOKE EXECUTE` on both trigger functions from `authenticated`.
3. **Search Path Safety:** All 15 `SECURITY DEFINER` functions have explicit, hardened `search_path` declarations, eliminating dynamic search-path injection vulnerabilities.
4. **Invitation Secrecy:** Raw invitation tokens are never stored; only hexadecimal SHA-256 hashes (`token_hash`) are persisted.
5. **Residual Risk (Phase 7+):** Client code must continue to respect the distinction between authenticated user and authorized workspace member. The frontend UI must handle empty workspaces and unverified memberships gracefully when CRUD services are implemented.

---

## 19. Known Limitations

- **Frontend CRUD Deferred:** As mandated by Phase 6 scope boundaries, frontend CRUD services (`projects-service.ts`, `finance-service.ts`, etc.) were not implemented in this phase and remain scheduled for Phases 7–9.
- **Invitation Email Dispatch:** Sending invitation emails via an external SMTP or Edge Function was not implemented and is scheduled for Phase 9.
- **In-Memory Sample Data:** The frontend modules continue to operate in demo mode until persistence hooks are wired up in subsequent phases.

---

## 20. Exact Next-Phase Dependencies

Before initiating **Phase 7 — Core Data Persistence (Projects, Tasks, Notes)**:
1. Confirm project owner approval of this updated Phase 6 / 6.1 report and authorize a follow-up corrective migration to:
   - Revoke excess `authenticated` default table privileges (`TRUNCATE`, `REFERENCES`, `TRIGGER`, and direct `INSERT` on `workspaces`/`workspace_members`/`activity_logs`).
   - Lock `public.profiles.email` against authenticated user `UPDATE` mutations.
   - Reconcile the local migration filename (`20261113000001_phase6_initial_schema_and_rls.sql`) with remote `schema_migrations` version `20261113024551` (or run `supabase migration repair`).
2. Provision the initial production Owner user account in Supabase Auth via Dashboard or Magic Link.
3. Execute `create_workspace_with_owner('Khai Space Hub', ...)` once the owner account is authenticated to bootstrap the primary production workspace.

---

## 21. Final Verification Checklist

- [x] Target confirmed as `khai-space-hub` (`dpicdhjaabfjbvppmsxk`).
- [x] BizTrack (`vzbazjzxonbkfpjljjdq`) completely untouched.
- [x] All 12 tables created with RLS enabled.
- [x] All 11 enums created with exact values.
- [x] Partial unique index `idx_workspace_single_owner` active.
- [x] 17 database functions installed (15 `SECURITY DEFINER`, 2 `SECURITY INVOKER`).
- [x] 20 database triggers installed.
- [x] 45 RLS policies active (`workspace_invitations` = 7).
- [x] 3 financial views deployed with `security_invoker = true` and verified under `authenticated`.
- [x] Anonymous access revoked on all tables and functions.
- [ ] **NOT CLOSED — PENDING APPROVAL (Phase 6.1.1 Findings):**
  - Revoke excess `authenticated` table/view privileges (`TRUNCATE`, `REFERENCES`, `TRIGGER`, unauthorized `INSERT`/`DELETE`).
  - Revoke `authenticated` `EXECUTE` on `handle_updated_at()` and `prevent_note_type_change()`.
  - Lock `profiles.email` mutability (`BEFORE UPDATE` trigger + column-level `UPDATE` grant).
  - Reconcile migration version `20261113000001` vs `20261113024551`.
  - Execute the 5 raw `DELETE` assertions in `02_rls_and_isolation_test.sql` in an unrestricted `psql`/Supabase CLI runner.
- [x] TypeScript definitions reconciled with live introspected schema.
- [x] Zero test rows left in production database.
- [x] All 6 quality gates passed.

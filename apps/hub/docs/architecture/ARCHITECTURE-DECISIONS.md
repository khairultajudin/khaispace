# Khai Space Hub — Architecture Decision Records (ADR)
**Document Version:** 1.1.0 (Phase 3.1 Security Hardened)  
**Phase:** Phase 3.1 Security & Architecture Correction Pass  
**Application Target:** `apps/hub/`  
**Working Branch:** `feature/khai-space-hub`  
**Repository:** `khairultajudin/khaispace`

---

## Index of Architecture Decision Records

- [ADR-001: Next.js Static Export Architecture vs Dynamic Server Runtime](#adr-001-nextjs-static-export-architecture-vs-dynamic-server-runtime)
- [ADR-002: Standalone Supabase Project Isolation (Zero BizTrack Coupling)](#adr-002-standalone-supabase-project-isolation-zero-biztrack-coupling)
- [ADR-003: Multi-Tenant Workspace Scoping with Direct PostgREST RLS](#adr-003-multi-tenant-workspace-scoping-with-direct-postgrest-rls)
- [ADR-004: Exact Decimal Storage (`numeric(12,2)`) for Financial Ledger](#adr-004-exact-decimal-storage-numeric122-for-financial-ledger)
- [ADR-005: Strict Investment Return Tagging (`is_investment_return`) for Realized ROI](#adr-005-strict-investment-return-tagging-is_investment_return-for-realized-roi)
- [ADR-006: Independent AI Subscriptions Tracking (Decoupled from Ledger)](#adr-006-independent-ai-subscriptions-tracking-decoupled-from-ledger)
- [ADR-007: Security Definer Helper Functions for Recursive RLS Policy Prevention](#adr-007-security-definer-helper-functions-for-recursive-rls-policy-prevention)
- [ADR-008: Soft Deletion vs Hard Deletion Policy across Hub Entities](#adr-008-soft-deletion-vs-hard-deletion-policy-across-hub-entities)
- [ADR-009: Invitation-Only Workspace Membership (No Public Signup)](#adr-009-invitation-only-workspace-membership-no-public-signup)
- [ADR-010: Separation of Development Sample Data from Production Storage](#adr-010-separation-of-development-sample-data-from-production-storage)
- [ADR-011: Enforcing Single Owner & Prohibiting Admin Privilege Escalation](#adr-011-enforcing-single-owner--prohibiting-admin-privilege-escalation)
- [ADR-012: Database-Level Cross-Workspace Relational Integrity & Safe Cleanup](#adr-012-database-level-cross-workspace-relational-integrity--safe-cleanup)
- [ADR-013: SQL Views Security Hardening via Security Invoker Mode](#adr-013-sql-views-security-hardening-via-security-invoker-mode)
- [ADR-014: Standardized UUID Primary Keys Across All Core Entities](#adr-014-standardized-uuid-primary-keys-across-all-core-entities)

---

## ADR-001: Next.js Static Export Architecture vs Dynamic Server Runtime
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** The Hub currently builds with `output: "export"` in `next.config.ts`, generating pure static HTML/JS/CSS assets deployed to Cloudflare Pages alongside the public website. Connecting a database could motivate switching to Next.js SSR / Server Actions.
- **Decision:** Preserve `output: "export"`. Access Supabase directly from the browser using `@supabase/supabase-js` protected by PostgreSQL Row Level Security (RLS). For privileged operations requiring secret keys (e.g. inviting users via admin API), utilize Supabase Edge Functions (Deno).
- **Consequences:**
  - *Positive:* Sub-second CDN page delivery, zero server maintenance, no Cloudflare Worker SSR cold-start latency, zero hosting cost increase.
  - *Negative:* Cannot run Node.js middleware on incoming requests; all authorization must be strictly enforced at the PostgreSQL RLS boundary.
- **Alternatives Considered:** Full Next.js SSR on Cloudflare Workers (rejected: increases complexity, deployment coupling, and potential cold-start overhead).

---

## ADR-002: Standalone Supabase Project Isolation (Zero BizTrack Coupling)
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** Khai Space operates other internal projects, including BizTrack. A decision is required on whether to share database clusters or enforce total isolation.
- **Decision:** Mandate a **dedicated, separate Supabase project** exclusively for Khai Space Hub. Under no circumstances may Hub connect to, read from, or share credentials with the BizTrack database.
- **Consequences:**
  - *Positive:* Total security isolation; eliminates cross-application blast radius; prevents schema collisions; guarantees client privacy.
  - *Negative:* Requires managing two distinct Supabase projects.
- **Alternatives Considered:** Multi-tenant schema sharing in a single database (rejected: unacceptable risk of credential leakage and compliance violation).

---

## ADR-003: Multi-Tenant Workspace Scoping with Direct PostgREST RLS
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** The Hub is initially a private command center for Khai and his wife, but must support clean multi-user membership and future tenant expansion.
- **Decision:** Structure all data tables with a mandatory `workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`. Every query executed via PostgREST is filtered automatically by PostgreSQL Row Level Security evaluating `auth.uid()` against active workspace membership.
- **Consequences:**
  - *Positive:* Database-level tenant boundary; eliminates Insecure Direct Object Reference (IDOR) attacks; client cannot spoof `workspace_id`.
  - *Negative:* Every table must maintain a `workspace_id` foreign key and corresponding index.
- **Alternatives Considered:** Single-tenant flat schema without `workspace_id` (rejected: would require massive structural rewrite when adding multi-user collaboration).

---

## ADR-004: Exact Decimal Storage (`numeric(12,2)`) for Financial Ledger
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** Financial amounts are represented in JavaScript as IEEE 754 floating-point numbers (`number`), which are subject to binary rounding errors (e.g. `0.1 + 0.2 !== 0.3`).
- **Decision:** Store all currency amounts in PostgreSQL as `numeric(12, 2)`. Prohibit floating-point types (`float`, `real`, `double precision`) in all financial and subscription tables.
- **Consequences:**
  - *Positive:* Exact cent accuracy; compliance with standard accounting practices; elimination of rounding discrepancies.
  - *Negative:* Client must parse numeric strings into formatted numbers using `formatMYR()` utility.
- **Alternatives Considered:** Integer cents storage (e.g. `100` = RM 1.00) (rejected: adds conversion friction when communicating with standard SQL reporting tools and PostgREST).

---

## ADR-005: Strict Investment Return Tagging (`is_investment_return`) for Realized ROI
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** In Phase 2D, an initial implementation fell back to treating all operating income as investment return when calculating project ROI, which proved financially misleading.
- **Decision:** Preserve the strict rule: **Realized ROI is computed ONLY from income transactions where `is_investment_return = true`**. Ordinary operating income (retainers, software sales, service fees) is strictly excluded. If capital outlay exists with no explicitly tagged returns, ROI displays `N/A — Insufficient Return Data`.
- **Consequences:**
  - *Positive:* Mathematically and commercially honest ROI reporting on capital assets; prevents false profitability signals.
  - *Negative:* User must explicitly toggle the "Investment Return" checkbox when logging revenue intended to recoup capital outlay.
- **Alternatives Considered:** Automatic operating income amortization against investment (rejected: conflates operating cashflow with capital asset recovery).

---

## ADR-006: Independent AI Subscriptions Tracking (Decoupled from Ledger)
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** Users track AI subscriptions (Claude, ChatGPT, Cursor, Midjourney) in `apps/hub`. Should these automatically insert expense records into `financial_transactions`?
- **Decision:** Keep `ai_subscriptions` **decoupled from `financial_transactions`**. Subscriptions serve as an operational license directory and cost commitment forecasting tool. Ledger transactions are recorded in `financial_transactions` only when payment is formally realized.
- **Consequences:**
  - *Positive:* Prevents phantom double-counting; accounts for paused, cancelled, or annual billing schedules accurately; keeps the general ledger immutable.
  - *Negative:* User must record realized payments in the ledger (or trigger a future explicit "Log Payment to Ledger" button).
- **Alternatives Considered:** Automatic recurring cron job inserting expenses into ledger (rejected: causes ghost ledger entries when credit card charges fail or renew on different dates).

---

## ADR-007: Security Definer Helper Functions for Recursive RLS Policy Prevention
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** Enforcing RLS on `workspace_members` by querying `workspace_members` triggers PostgreSQL infinite policy recursion.
- **Decision:** Implement `is_workspace_member(ws_id)` and `get_user_workspace_role(ws_id)` as `SECURITY DEFINER` functions with fixed `search_path = public, auth, pg_temp`. Revoke anonymous execution privileges.
- **Consequences:**
  - *Positive:* Completely bypasses the recursive policy trap; caches results per transaction using `STABLE`; protects against search-path hijacking.
  - *Negative:* Helper functions must be maintained with strict security hygiene.
- **Alternatives Considered:** Disabling RLS on `workspace_members` (rejected: catastrophic security hole allowing any user to read/modify roster records).

---

## ADR-008: Soft Deletion vs Hard Deletion Policy across Hub Entities
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** Different data entities require different lifecycle and deletion behaviors.
- **Decision:** Adopt a hybrid deletion policy:
  - **Financial Transactions:** Hard deletion restricted to Admins/Owners. Deleting a project triggers `handle_project_deletion_cleanup()`, setting `project_id = NULL` and preserving historical transactions under General Operations (Unassigned / Shared).
  - **Projects, Milestones, Tasks:** Hard deletion with cascade for subordinate tasks/milestones.
  - **AI Subscriptions:** Soft state transition (`status = 'Cancelled'`) preferred over physical deletion to preserve renewal history.
  - **Activity Logs:** Append-only; `UPDATE` and `DELETE` permanently blocked via RLS.
- **Consequences:**
  - *Positive:* Prevents orphaned financial metrics; preserves audit integrity; allows clean cleanup of scratch tasks and notes.
- **Alternatives Considered:** Universal soft delete with `deleted_at` on every table (rejected: bloats queries with `WHERE deleted_at IS NULL` and complicates unique constraints).

---

## ADR-009: Invitation-Only Workspace Membership (No Public Signup)
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** Khai Space Hub is a private, internal command center. Public registration would expose sensitive operational plans and financial figures.
- **Decision:** Permanently disable public user signup in Supabase Auth (`enable_signup = false`). New collaborators (e.g. Khai's wife) can only register when accepted through an invitation token generated by the workspace Owner.
- **Consequences:**
  - *Positive:* Absolute access control; zero risk of unauthorized public accounts creating workspaces or accessing records.
  - *Negative:* Owner must initiate an invitation before a new user can access the system.
- **Alternatives Considered:** Public signup with manual workspace approval (rejected: unnecessary attack surface for a private executive command center).

---

## ADR-010: Separation of Development Sample Data from Production Storage
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09
- **Context:** Existing frontend views feature "Reset Baseline" buttons that overwrite in-memory state with sample data from `sample-dashboard-data.ts`.
- **Decision:** In production environments (`NEXT_PUBLIC_APP_ENV="production"`), **permanently hide and disable all "Reset Baseline" buttons**. Restrict sample data seeding exclusively to local development (`NEXT_PUBLIC_ENABLE_DEMO_SEED="true"`). New production workspaces initialize with clean, empty states.
- **Consequences:**
  - *Positive:* Eliminates catastrophic accidental data wipeouts in production; retains offline mock data for testing and development.
  - *Negative:* Developers must ensure empty state UI components are fully designed and accessible.
- **Alternatives Considered:** Allowing reset with a password confirmation (rejected: too dangerous to leave destructive sample-override endpoints in production code).

---

## ADR-011: Enforcing Single Owner & Prohibiting Admin Privilege Escalation
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09 (Phase 3.1)
- **Context:** In Phase 3, the RLS policy `Admins manage roster FOR ALL` inadvertently allowed an Administrator to promote themselves to Owner, assign the Owner role to another user, or modify the Owner's row.
- **Decision:** 
  1. Add a partial unique index: `CREATE UNIQUE INDEX idx_workspace_single_owner ON workspace_members(workspace_id) WHERE (role = 'Owner')`.
  2. Implement granular RLS policies on `workspace_members` prohibiting Administrators from inserting `role = 'Owner'`, modifying their own role (`user_id != auth.uid()`), or altering the Owner.
  3. Prohibit ownership transfer in this version.
  4. Implement an atomic, security-definer function `create_workspace_with_owner()` for initial setup.
- **Consequences:**
  - *Positive:* Eliminates administrative privilege escalation, split ownership, and lockout vulnerabilities.
  - *Negative:* Ownership changes require database administrator intervention if ever needed in the future.
- **Alternatives Considered:** Multi-owner consensus model (rejected: inappropriate for a private executive command center owned by Khai).

---

## ADR-012: Database-Level Cross-Workspace Relational Integrity & Safe Cleanup
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09 (Phase 3.1)
- **Context:** Foreign keys on `project_id` alone allowed records in Workspace A to point to projects in Workspace B. Furthermore, composite foreign keys with `ON DELETE SET NULL` can fail in PostgreSQL if they attempt to nullify `workspace_id`.
- **Decision:**
  1. Add composite unique constraints on parent entities: `projects(workspace_id, id)` and `milestones(workspace_id, id)`.
  2. Use composite foreign keys for tight child entities (`milestones -> projects`, `tasks -> projects`, `tasks -> milestones`) with `ON DELETE CASCADE`.
  3. For optional associations (`financial_transactions`, `ai_subscriptions`, `workspace_notes`), implement an explicit validation trigger `validate_project_workspace_integrity()` and an atomic cleanup trigger `handle_project_deletion_cleanup()`.
- **Consequences:**
  - *Positive:* Prevents cross-workspace data leakage at the database engine level; preserves financial history when projects are deleted without violating `NOT NULL` constraints.
  - *Negative:* Slight additional trigger overhead on project deletion.

---

## ADR-013: SQL Views Security Hardening via Security Invoker Mode
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09 (Phase 3.1)
- **Context:** By default in PostgreSQL, SQL views run with view-owner privileges (`security_definer` behavior), which could allow users querying PostgREST views to bypass table-level RLS.
- **Decision:** Create all three financial views (`view_overall_finance_kpis`, `view_project_finance_summary`, `view_monthly_financial_trends`) with `WITH (security_invoker = true)` and revoke permissions from `anon` and `public`.
- **Consequences:**
  - *Positive:* Guarantees that view queries execute under the identity and RLS policies of the authenticated caller (`auth.uid()`), preventing cross-tenant financial aggregation leaks.
  - *Negative:* Requires PostgreSQL 15+ (standard in all modern Supabase clusters).

---

## ADR-014: Standardized UUID Primary Keys Across All Core Entities
- **Status:** **ACCEPTED**
- **Date:** 2026-11-09 (Phase 3.1)
- **Context:** Phase 3 documentation claimed UUID primary keys, but the SQL draft utilized client-prefixed varchar IDs (`task-1`, `tx-01`, `biztrack`).
- **Decision:** Standardize all table primary keys to `uuid DEFAULT gen_random_uuid()`. For projects, introduce a separate workspace-scoped `slug varchar(50) NOT NULL` for clean human URLs and deep linking.
- **Consequences:**
  - *Positive:* 100% internal consistency between schema DDL and architecture documentation; eliminates cross-workspace ID collisions; follows PostgreSQL and Supabase best practices.
  - *Negative:* Seed data and frontend services must map client slugs to UUIDs.

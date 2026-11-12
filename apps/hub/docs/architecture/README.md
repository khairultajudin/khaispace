# Khai Space Hub — Architecture & Persistence Documentation Index
**Document Version:** 1.5.1 (Phase 4.1 Type Integrity & Documentation Reconciled)
**Phase:** Phase 4.1 — Database Type Integrity, RPC Contract Reconciliation & Documentation Correction
**Application Target:** `apps/hub/`
**Working Branch:** `feature/khai-space-hub`
**Repository:** `khairultajudin/khaispace`

---

## 1. Executive Summary

This documentation suite establishes the **production data architecture and persistence blueprint** for **Khai Space Hub**.

The architecture transitions the Hub from in-memory React session state to a secure, persistent, multi-tenant Supabase PostgreSQL database while preserving the existing Next.js static export deployment model (`output: "export"`) on Cloudflare Pages.

### Core Architecture Pillars
- **Zero-Trust Client Security:** Defense-in-depth enforced by PostgreSQL Row Level Security (RLS) on every table.
- **Dedicated Supabase Project:** Isolated `khai-space-hub` project in `ap-southeast-1` (Singapore) with zero shared resources.
- **Verified Email Identity:** Invitation acceptance enforces authoritative `auth.users` lookup, confirmed email check (`email_confirmed_at IS NOT NULL`), and row-level concurrency locking.
- **Exact Accounting Standards:** Financial transactions and AI subscriptions stored in exact `numeric(12, 2)` decimal currency (MYR).
- **Strict ROI Calculation:** Realized ROI is computed **exclusively** from transactions certified with `is_investment_return = true`.
- **Private Workspace Model:** Public self-registration is permanently disabled; access is strictly invitation-only.
- **Hybrid Static Architecture:** Preserves sub-second Cloudflare CDN delivery for the frontend while using direct PostgREST RLS for client CRUD and Supabase Edge Functions for elevated administrative operations.

---

## 2. Documentation Map & Navigation

The architecture directory under [`apps/hub/docs/architecture/`](file:///e:/KhaiSpace/apps/hub/docs/architecture/) contains **20 Markdown and SQL documentation files (18 Markdown documents and 2 SQL scripts), including README.md**:

| Document | Primary Focus | Target Audience |
|:---|:---|:---|
| **[`PHASE-4.1-TYPE-INTEGRITY-CORRECTION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-4.1-TYPE-INTEGRITY-CORRECTION-REPORT.md)** | Phase 4.1 audit and 1:1 reconciliation of TypeScript database types, enums, views, relationships, and RPC signatures against `schema-draft.sql`. | All Stakeholders, Security Auditors, TypeScript & Database Engineers |
| **[`PHASE-4-SUPABASE-FOUNDATION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-4-SUPABASE-FOUNDATION-REPORT.md)** | Phase 4 Supabase foundation, project provisioning, SDK client singleton, planned database types, and safe verification report. | All Stakeholders, Security Auditors, Technical Lead |
| **[`PHASE-3-FINAL-REVIEW-AND-CLOSURE.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3-FINAL-REVIEW-AND-CLOSURE.md)** | Official Phase 3 Final Review & Closure Record certifying architectural completion and strict change control boundaries. | All Stakeholders, Security Auditors, Project Owner |
| **[`PHASE-3.3.1-VERIFIED-EMAIL-CORRECTION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3.3.1-VERIFIED-EMAIL-CORRECTION-REPORT.md)** | Definitive verified-email enforcement, authoritative auth lookup, and full 15 SECURITY DEFINER inventory reconciliation. | All Stakeholders, Security Auditors |
| **[`PHASE-3.3-FINAL-VALIDATION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3.3-FINAL-VALIDATION-REPORT.md)** | SQL validation, UUID verification, Auth hook installation, and privilege boundary closure report. | All Stakeholders, Security Auditors |
| **[`PHASE-3.2-FINAL-CORRECTION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3.2-FINAL-CORRECTION-REPORT.md)** | Database integrity, composite foreign key nullification, lifecycle coordination, and provisioning safeguards report. | All Stakeholders, Security Auditors |
| **[`PHASE-3.1-SECURITY-CORRECTION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3.1-SECURITY-CORRECTION-REPORT.md)** | Initial security audit & correction pass report addressing privilege escalation, views, and keys. | All Stakeholders, Security Auditors |
| **[`CURRENT-STATE-AUDIT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/CURRENT-STATE-AUDIT.md)** | Ground-truth audit of existing types, sample datasets, utilities, and session state limitations. | Full-Stack Engineers, Product Lead |
| **[`SYSTEM-ARCHITECTURE.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/SYSTEM-ARCHITECTURE.md)** | Target system architecture, static export compatibility analysis, layer responsibilities, and Mermaid diagrams. | Principal Architects, DevOps |
| **[`DATABASE-SCHEMA.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATABASE-SCHEMA.md)** | Normalized relational schema for all 12 core entities, columns, data types, constraints, and ER diagram. | Database Engineers, Backend Leads |
| **[`RLS-SECURITY-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/RLS-SECURITY-DESIGN.md)** | Comprehensive Row Level Security matrix, anti-recursion helper functions, owner protection, and threat modeling. | Security Engineers, Supabase Specialists |
| **[`FINANCE-DATA-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/FINANCE-DATA-DESIGN.md)** | Exact monetary storage, strict ROI business rules, orphan handling, and pre-computed SQL accounting views. | Financial Analysts, Data Engineers |
| **[`DATA-ACCESS-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATA-ACCESS-DESIGN.md)** | Frontend service/repository layer, typed client singleton, state mapping, and production demo-mode safeguards. | Frontend Developers, UI Engineers |
| **[`MIGRATION-ROADMAP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/MIGRATION-ROADMAP.md)** | Step-by-step future implementation roadmap (Phases 4 through 10), dashboard prerequisites, and rollback protocols. | Project Leads, Release Managers |
| **[`OPERATIONS-AND-BACKUP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/OPERATIONS-AND-BACKUP.md)** | Multi-tier backup strategy (PITR, Daily, Offsite, Portable Export), audit logging, and query health. | Site Reliability Engineers, SysAdmins |
| **[`ARCHITECTURE-DECISIONS.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/ARCHITECTURE-DECISIONS.md)** | 18 formal Architecture Decision Records (ADRs) capturing rationale, consequences, and evaluated alternatives. | Technical Governance, Architecture Board |
| **[`IMPLEMENTATION-READINESS-CHECKLIST.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/IMPLEMENTATION-READINESS-CHECKLIST.md)** | Historical Phase 3 verification checklist certifying planning completeness and sign-off prerequisites that preceded Phase 4. | Lead Reviewers, Stakeholders |
| **[`schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql)** | Complete PostgreSQL DDL script with tables, enums, indexes, triggers, helper functions, and RLS policies (Draft only). | Database Administrators |
| **[`seed-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/seed-draft.sql)** | Development-only mock seed script mapping existing sample data into relational tables. | Developers (Local Testing) |

---

## 3. Recommended Reading Paths by Role

### For the Technical Lead & Stakeholders
1. Start with this **`README.md`** for the executive summary and current phase status.
2. Review **[`PHASE-4.1-TYPE-INTEGRITY-CORRECTION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-4.1-TYPE-INTEGRITY-CORRECTION-REPORT.md)** and **[`PHASE-4-SUPABASE-FOUNDATION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-4-SUPABASE-FOUNDATION-REPORT.md)** for the current Supabase project foundation, client setup, and 1:1 SQL-to-TypeScript schema type reconciliation.
3. Review **[`PHASE-3-FINAL-REVIEW-AND-CLOSURE.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3-FINAL-REVIEW-AND-CLOSURE.md)**, **[`PHASE-3.3.1-VERIFIED-EMAIL-CORRECTION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3.3.1-VERIFIED-EMAIL-CORRECTION-REPORT.md)**, and **[`PHASE-3.3-FINAL-VALIDATION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-3.3-FINAL-VALIDATION-REPORT.md)** for the Phase 3 architectural closure and security validation record.
4. Review **[`SYSTEM-ARCHITECTURE.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/SYSTEM-ARCHITECTURE.md)** and **[`ARCHITECTURE-DECISIONS.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/ARCHITECTURE-DECISIONS.md)** to inspect the hybrid static export approach and architectural trade-offs.
5. Inspect **[`MIGRATION-ROADMAP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/MIGRATION-ROADMAP.md)** before authorizing Phase 5 (Authentication) or Phase 6 (Database Schema Deployment).

### For the Senior Database & Security Engineer
1. Review **[`DATABASE-SCHEMA.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATABASE-SCHEMA.md)** and the Mermaid ERD.
2. Review **[`RLS-SECURITY-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/RLS-SECURITY-DESIGN.md)** for anti-recursion helpers and policy matrices.
3. Audit **[`FINANCE-DATA-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/FINANCE-DATA-DESIGN.md)** for the strict ROI accuracy rule.
4. Inspect the draft DDL in **[`schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql)** and its TypeScript reconciliation in **[`PHASE-4.1-TYPE-INTEGRITY-CORRECTION-REPORT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/PHASE-4.1-TYPE-INTEGRITY-CORRECTION-REPORT.md)**.

### For the Frontend Software Engineer
1. Read **[`CURRENT-STATE-AUDIT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/CURRENT-STATE-AUDIT.md)** to understand how existing state models map to database fields.
2. Review **[`DATA-ACCESS-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATA-ACCESS-DESIGN.md)** for the planned `apps/hub/src/services/` folder structure, client singleton (`apps/hub/src/lib/supabase/client.ts`), and planned schema types (`apps/hub/src/types/database.types.ts`).
3. Check **[`seed-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/seed-draft.sql)** to see how sample data is structured for future local testing in Phase 6.

---

## 4. Operational Boundaries & Current Project State

> [!IMPORTANT]
> **Historical Milestone Context & Current Phase 4.1 State:**
> - **Phase 3 Historical Boundary:** Phase 3 was strictly an architectural design, planning, and documentation milestone; no live database existed during Phase 3.
> - **Phase 4 & 4.1 Foundation Completed:** Following explicit project-owner approval, Phase 4 provisioned the dedicated, isolated Supabase project **`khai-space-hub`** in region **`ap-southeast-1` (Singapore)**, installed the official `@supabase/supabase-js` SDK, and implemented the browser client singleton ([`apps/hub/src/lib/supabase/client.ts`](file:///e:/KhaiSpace/apps/hub/src/lib/supabase/client.ts)) and planned-schema TypeScript definitions ([`apps/hub/src/types/database.types.ts`](file:///e:/KhaiSpace/apps/hub/src/types/database.types.ts)), which were reconciled 1:1 with [`schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql) in Phase 4.1.
> - **Planned-Schema Type Provenance:** The TypeScript definitions in `apps/hub/src/types/database.types.ts` are derived from the planned SQL blueprint (`schema-draft.sql`) and are **not** live-generated schema types.
> - **Live Schema Not Yet Deployed:** No tables, enums, views, triggers, RLS policies, or seed data have been deployed to the remote Supabase database.
> - **Authentication Not Yet Implemented:** No login UI, Magic Link/OTP flows, or session guards have been implemented.
> - **Current Frontend Execution Mode:** All 7 Khai Space Hub modules continue to operate in local in-memory React session/demo mode with zero breaking changes.
> - **Future Phase Authorization Required:** Execution of **Phase 5 (Authentication & Workspace Access)** and **Phase 6 (Database Schema & RLS Deployment)** remains strictly blocked pending separate explicit authorization from the project owner.

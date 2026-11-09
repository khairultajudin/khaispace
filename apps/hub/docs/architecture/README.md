# Khai Space Hub — Architecture & Persistence Documentation Index
**Document Version:** 1.0.0  
**Phase:** Phase 3 Data Architecture & Persistence Planning  
**Application Target:** `apps/hub/`  
**Working Branch:** `feature/khai-space-hub`  
**Repository:** `khairultajudin/khaispace`

---

## 1. Executive Summary

This documentation suite establishes the **production data architecture and persistence blueprint** for **Khai Space Hub**. 

The architecture transitions the Hub from in-memory React session state to a secure, persistent, multi-tenant Supabase PostgreSQL database while preserving the existing Next.js static export deployment model (`output: "export"`) on Cloudflare Pages.

### Core Architecture Pillars
- **Zero-Trust Client Security:** Defense-in-depth enforced by PostgreSQL Row Level Security (RLS) on every table.
- **Dedicated Supabase Project:** Absolute separation from other projects (e.g. BizTrack) with zero shared credentials.
- **Exact Accounting Standards:** Financial transactions and AI subscriptions stored in exact `numeric(12, 2)` decimal currency (MYR).
- **Strict ROI Calculation:** Realized ROI is computed **exclusively** from transactions certified with `is_investment_return = true`.
- **Private Workspace Model:** Public self-registration is permanently disabled; access is strictly invitation-only.
- **Hybrid Static Architecture:** Preserves sub-second Cloudflare CDN delivery for the frontend while using direct PostgREST RLS for client CRUD and Supabase Edge Functions for elevated administrative operations.

---

## 2. Documentation Map & Navigation

The Phase 3 deliverables under [`apps/hub/docs/architecture/`](file:///e:/KhaiSpace/apps/hub/docs/architecture/) comprise 13 comprehensive specifications:

| Document | Primary Focus | Target Audience |
|:---|:---|:---|
| **[`CURRENT-STATE-AUDIT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/CURRENT-STATE-AUDIT.md)** | Ground-truth audit of existing types, sample datasets, utilities, and session state limitations. | Full-Stack Engineers, Product Lead |
| **[`SYSTEM-ARCHITECTURE.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/SYSTEM-ARCHITECTURE.md)** | Target system architecture, static export compatibility analysis, layer responsibilities, and Mermaid diagrams. | Principal Architects, DevOps |
| **[`DATABASE-SCHEMA.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATABASE-SCHEMA.md)** | Normalized relational schema for all 12 core entities, columns, data types, constraints, and ER diagram. | Database Engineers, Backend Leads |
| **[`RLS-SECURITY-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/RLS-SECURITY-DESIGN.md)** | Comprehensive Row Level Security matrix, anti-recursion helper functions, owner protection, and threat modeling. | Security Engineers, Supabase Specialists |
| **[`FINANCE-DATA-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/FINANCE-DATA-DESIGN.md)** | Exact monetary storage, strict ROI business rules, orphan handling, and pre-computed SQL accounting views. | Financial Analysts, Data Engineers |
| **[`DATA-ACCESS-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATA-ACCESS-DESIGN.md)** | Frontend service/repository layer, typed client singleton, state mapping, and production demo-mode safeguards. | Frontend Developers, UI Engineers |
| **[`MIGRATION-ROADMAP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/MIGRATION-ROADMAP.md)** | Step-by-step future implementation roadmap (Phases 4 through 10), dashboard prerequisites, and rollback protocols. | Project Leads, Release Managers |
| **[`OPERATIONS-AND-BACKUP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/OPERATIONS-AND-BACKUP.md)** | Multi-tier backup strategy (PITR, Daily, Offsite, Portable Export), audit logging, and query health. | Site Reliability Engineers, SysAdmins |
| **[`ARCHITECTURE-DECISIONS.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/ARCHITECTURE-DECISIONS.md)** | 10 formal Architecture Decision Records (ADRs) capturing rationale, consequences, and evaluated alternatives. | Technical Governance, Architecture Board |
| **[`IMPLEMENTATION-READINESS-CHECKLIST.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/IMPLEMENTATION-READINESS-CHECKLIST.md)** | Verification checklist certifying Phase 3 completeness and sign-off prerequisites for Phase 4. | Lead Reviewers, Stakeholders |
| **[`schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql)** | Complete PostgreSQL DDL script with tables, enums, indexes, triggers, helper functions, and RLS policies (Draft only). | Database Administrators |
| **[`seed-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/seed-draft.sql)** | Development-only mock seed script mapping existing sample data into relational tables. | Developers (Local Testing) |

---

## 3. Recommended Reading Paths by Role

### For the Technical Lead & Stakeholders
1. Start with this **`README.md`** for the executive summary.
2. Review **[`SYSTEM-ARCHITECTURE.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/SYSTEM-ARCHITECTURE.md)** to inspect the hybrid static export approach.
3. Review **[`ARCHITECTURE-DECISIONS.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/ARCHITECTURE-DECISIONS.md)** to evaluate key architectural trade-offs.
4. Inspect **[`MIGRATION-ROADMAP.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/MIGRATION-ROADMAP.md)** and **[`IMPLEMENTATION-READINESS-CHECKLIST.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/IMPLEMENTATION-READINESS-CHECKLIST.md)** before approving Phase 4.

### For the Senior Database & Security Engineer
1. Review **[`DATABASE-SCHEMA.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATABASE-SCHEMA.md)** and the Mermaid ERD.
2. Review **[`RLS-SECURITY-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/RLS-SECURITY-DESIGN.md)** for anti-recursion helpers and policy matrices.
3. Audit **[`FINANCE-DATA-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/FINANCE-DATA-DESIGN.md)** for the strict ROI accuracy rule.
4. Inspect the draft DDL in **[`schema-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/schema-draft.sql)**.

### For the Frontend Software Engineer
1. Read **[`CURRENT-STATE-AUDIT.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/CURRENT-STATE-AUDIT.md)** to understand how existing state models map to database fields.
2. Review **[`DATA-ACCESS-DESIGN.md`](file:///e:/KhaiSpace/apps/hub/docs/architecture/DATA-ACCESS-DESIGN.md)** for the planned `apps/hub/src/services/` folder structure and client hooks.
3. Check **[`seed-draft.sql`](file:///e:/KhaiSpace/apps/hub/docs/architecture/seed-draft.sql)** to see how sample data can be used for local testing.

---

## 4. Operational Boundaries & Scope Protection

> [!IMPORTANT]
> **Strict Phase 3 Constraint:**
> Phase 3 is strictly an architectural design, planning, and documentation milestone.
> 
> - No live database has been provisioned.
> - No migrations have been executed against any remote instance.
> - No live authentication or database credentials have been committed.
> - The current frontend continues to function flawlessly in local session-state mode.
> 
> Implementation of persistence begins in **Phase 4** only after explicit stakeholder approval.

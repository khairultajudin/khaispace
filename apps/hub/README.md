# Khai Space Hub

Internal Command Center and Project Management Console for the Khai Space ecosystem.

## Overview

Khai Space Hub is an independent Next.js application residing within the `apps/hub/` directory of the `khairultajudin/khaispace` monorepo.

## Architecture & Isolation

* **Isolated Application Directory**: `apps/hub/`
* **Isolated Dependencies & Build**: Runs independently with its own `package.json`, `tsconfig.json`, and static HTML export.
* **Non-Interference**: Does not touch, alter, or break the public production website residing at the repository root.

## Local Development

From the repository root:
```bash
# Navigate to Hub
cd apps/hub

# Install dependencies (first time only)
npm install

# Start development server on port 3001
npm run dev
```

The Hub will be available at [http://localhost:3001](http://localhost:3001).

## Independent Build & Verification

```bash
cd apps/hub
npm run typecheck
npm run build
```
This generates a static export in `apps/hub/out/`.

## Cloudflare Pages Configuration

When connecting Khai Space Hub to Cloudflare Pages:

| Setting | Value |
| :--- | :--- |
| **Framework preset** | Next.js (Static Export) / None |
| **Root directory** | `apps/hub` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Node.js version** | `20.x` or higher |

Environment variables for Hub should be configured strictly within the Cloudflare Pages project settings for this application.

## Current Persistence & Deployment Status (Phases 6–10)

- **Branch:** `feature/khai-space-hub`
- **Database Target:** `khai-space-hub` (`dpicdhjaabfjbvppmsxk`, `ap-southeast-1`)
- **Phase 6 Security Status:** Reconciled (`20261113024551_phase6_initial_schema_and_rls.sql`) and Option B remediation deployed (`20261116144728_phase6_privilege_and_profile_remediation.sql`). `01_schema_catalog_validation.sql` (`POST_REMEDIATION`), `03_privilege_assertions_test.sql` (including `MAINTAIN`, `pg_has_role`, `pg_default_acl`, and `service_role`), and `02_rls_and_isolation_test.sql` (non-`DELETE` `POST_REMEDIATION`) all **PASS** on live `dpicdhjaabfjbvppmsxk`. The 5 raw `DELETE` assertions and isolated future-object simulation remain **NOT EXECUTED** (no local `psql`/`docker` on host; MCP auto-cancels raw `DELETE`).
- **Phases 7–9 Persistence Status:** Implemented across all core modules (Overview, Projects, Tasks & Milestones, Finance & ROI, AI Subscriptions, Notes & Decisions, Members & Settings with Option B `UPDATE`-only profile persistence, plus `WorkspaceOnboarding`). `npm run lint`, `npm run typecheck`, and `npm run build` all **PASS**.
- **Phase 10 Deployment Target:** `hub.khaispace.com` (Cloudflare Pages project `khai-space-hub`, `root_dir: apps/hub`, `destination_dir: out`).

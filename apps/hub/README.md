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
- **Phase 6 Security Status:** **CLOSED & FULLY VERIFIED.** Reconciled migrations (`20261113024551`, `20261116144728`, `20261117093000`). `01_schema_catalog_validation.sql` (`POST_REMEDIATION`), `03_privilege_assertions_test.sql` (PG 17 `MAINTAIN`, `pg_has_role`, `pg_default_acl`, `service_role`), live **future-object default-privilege simulation**, and the complete `02_rls_and_isolation_test.sql` via `psql` (including all 5 raw `DELETE` assertions and direct-milestone / cascade regression tests) all **PASS** on `dpicdhjaabfjbvppmsxk`.
- **Phases 7–9 Persistence & QA Status:** Implemented across all core modules (`lint`, `typecheck`, `build` **PASS**). Playwright unauthenticated/responsive E2E (`npm run test:e2e --prefix apps/hub`, 6/6) **PASS**. Live authenticated browser QA on `https://hub.khaispace.com/` **PASS** across all 12 checks.
- **Phase 10 Deployment Target:** `hub.khaispace.com` (Cloudflare Pages project `khai-space-hub`, `root_dir: apps/hub`, `destination_dir: out`, `production_branch: main`, protected by Cloudflare Access). Both `preview` and `production` (`main`) `NEXT_PUBLIC_*` env vars are configured.

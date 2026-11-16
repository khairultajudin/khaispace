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
- **Phase 6 Security Status:** Reconciled (`20261113024551_phase6_initial_schema_and_rls.sql`) and Option B remediation deployed (`20261116144728_phase6_privilege_and_profile_remediation.sql`). `01_schema_catalog_validation.sql` (`POST_REMEDIATION`), `03_privilege_assertions_test.sql` (including `MAINTAIN`, `pg_has_role`, `pg_default_acl`, and `service_role`), `02_rls_and_isolation_test.sql` (non-`DELETE` `POST_REMEDIATION`), and live **future-object default-privilege simulation** all **PASS** on `dpicdhjaabfjbvppmsxk`. **Not yet fully verified:** the 5 raw `DELETE` assertions remain **NOT EXECUTED** (no `psql`/DB password on host; MCP auto-cancels raw `DELETE`).
- **Phases 7–9 Persistence & QA Status:** Implemented across all core modules (`lint`, `typecheck`, `build` **PASS**). Playwright E2E (`npm run test:e2e --prefix apps/hub`, 6/6 tests) **PASS** for unauthenticated `/login` redirect, `/auth/callback`, desktop/tablet/mobile responsiveness, zero console/network errors, and root `khaispace.com`. Authenticated browser CRUD E2E remains **NOT EXECUTED** (requires owner Magic Link / OTP + Cloudflare Access session).
- **Phase 10 Deployment Target:** `hub.khaispace.com` (Cloudflare Pages project `khai-space-hub`, `root_dir: apps/hub`, `destination_dir: out`, protected by Cloudflare Access). Both `preview` and `production` (`main`) `NEXT_PUBLIC_*` env vars are configured. `hub.khaispace.com` currently CNAMEs to `feature-khai-space-hub.khai-space-hub.pages.dev` (`preview` alias) pending merge to `main` and CNAME cutover to `khai-space-hub.pages.dev`.

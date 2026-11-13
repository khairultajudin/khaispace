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

## Current Persistence Status (Phase 6.1.4)

- **Branch:** `feature/khai-space-hub`
- **Database Target:** `khai-space-hub` (`dpicdhjaabfjbvppmsxk`, `ap-southeast-1`)
- **Phase Status:** Phase 6 schema deployed (`20261113000001_phase6_initial_schema_and_rls.sql`, remote version `20261113024551`), currently **NOT CLOSED**. Existing-object privilege remediation, `ALTER DEFAULT PRIVILEGES` for `postgres` in `public`, `profiles.email` remediation, and migration version reconciliation are **NOT DEPLOYED** and remain **PENDING OWNER APPROVAL** ([`phase6_privilege_and_profile_remediation_proposal.sql`](file:///e:/KhaiSpace/apps/hub/supabase/proposed-remediations/phase6_privilege_and_profile_remediation_proposal.sql)); 5 raw `DELETE` tests and isolated future-object simulation remain **NOT EXECUTED**.
- **Frontend Mode:** Remains in local demo mode; **Phase 7 remains UNAUTHORIZED** until database remediations, migration reconciliation, and owner review are approved.

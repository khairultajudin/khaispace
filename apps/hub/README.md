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

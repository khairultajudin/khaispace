# Khai Space Public Portfolio → Private Hub Migration Record

**Date:** 2026-11-17  
**Public Website:** https://khaispace.com (Root `/`)  
**Private Hub:** https://hub.khaispace.com (`apps/hub/`, Supabase `dpicdhjaabfjbvppmsxk`)

---

## 1. Architectural Separation
- **Khai Space Public Website (`/`):** Public brand website presenting Khai Space identity, capabilities, studio focus areas (`StudioFocus`), services, and contact information. Contains zero private project names, portfolios, or internal documentation.
- **Khai Space Hub (`apps/hub/`):** Private workspace behind Cloudflare Access + Supabase Auth + PostgreSQL RLS, acting as the **single source of truth** for Khairul Tajudin's personal and internal project portfolio.

---

## 2. Migrated Project Inventory (7 Imported, 2 Existing Preserved)
All 7 portfolio entries from the former `src/content/projects.ts` were inserted into `public.projects` (`workspace_id = ca116272-0332-46f8-8de5-25df2e91fb3a`) using `ON CONFLICT (workspace_id, slug) DO NOTHING`:

| Slug | Title | Hub Category | Hub Status | Preserved Assets (`apps/hub/public`) |
| :--- | :--- | :--- | :--- | :--- |
| `memburu-jejak` | Memburu Jejak: Langkah Pertama | Creative & Publishing | Production | `/portfolio/memburu-jejak/` (`cover_front.jpg`, `index.html`, `reader.html`, `komik_reader.html`, comic PDF, docs) |
| `biztrack` | BizTrack: Sistem Pengurusan Operasi & Yuran | Business & Operations | Production | `/portfolio/biztrack/` (`index.html`, dashboard & analytics screenshots) |
| `hidroponik` | Hab Hidroponik: Pak Choy, Salad Framoc & Direktori Tanaman | Research & Experiments | Active | `/portfolio/hidroponik/` (`index.html`, `salad.html`, `tanaman.html`, 40+ progress photos) |
| `pixelpop` | PixelPop: Mainan Refleks & Memori | IoT & Electronics | In Development | `/portfolio/pixelpop/` (`index.html`, CAD exploded & pod renders) |
| `air-fryer-dashboard` | Air Fryer Dada Ayam Chef | Software & Web Development | Production | `/portfolio/air-fryer-dashboard/index.html` |
| `smart-rain-gauge` | Smart Rain Gauge | IoT & Electronics | Planning | Concept only (no filesystem assets) |
| `3d-printing-prototyping` | 3D Printing & Prototyping | Research & Experiments | Planning | Concept only (`Bambu_Lab_A1_Combo_Workshop.pptx` moved locally to `apps/hub/public/portfolio/3d-printing-prototyping/`) |

### Existing Records Preserved (No Duplicates)
- `QA Test Project` (`qa-test-project-3t2m`) — preserved untouched.
- `AI Assistant` (`ai-assistant-fwk2`) — preserved untouched.

---

## 3. Removed Public Routes & Privacy Verification
- **Removed from Root Public Website:**
  - `src/app/projects/page.tsx` (`/projects`)
  - `src/components/sections/featured-projects.tsx`
  - `src/content/projects.ts`
  - `src/components/projects/*`
  - `public/projects/*` (moved to `apps/hub/public/portfolio/*` behind Cloudflare Access)
  - `/projects` nav link in `src/lib/site.ts` and `/projects`, `/projects/hidroponik/` entries in `src/app/sitemap.ts`
- **Replaced Homepage Section:** `<FeaturedProjects />` replaced with `<StudioFocus />` (`src/components/sections/studio-focus.tsx`), and Hero CTA updated to `Explore Capabilities` (`/#capabilities`).


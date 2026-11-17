# Khai Space Hub — Architecture, Security, Backup & Future Roadmap

**Supabase Project:** `dpicdhjaabfjbvppmsxk` (`ap-southeast-1`, PostgreSQL 17.11)  
**Hosting:** Cloudflare Pages (`khai-space-hub`, `output: "export"`, `main` branch -> `https://hub.khaispace.com`)

---

## 1. System Architecture
- **Monorepo Layout:** Root `/` hosts the public website (`https://khaispace.com`); `apps/hub/` hosts Khai Space Hub independently.
- **Frontend:** Next.js 16 (App Router, static export `output: "export"`), React 19, TypeScript, Tailwind CSS v4.
- **Backend & Auth:** Direct browser client (`@supabase/supabase-js`) communicating with Supabase Auth & PostgREST under PostgreSQL Row Level Security (RLS). No service-role key is ever bundled in `apps/hub/`.
- **Environment Variables (Cloudflare Pages Production & `.env.local`):**
  - `NEXT_PUBLIC_APP_ENV` (`production`)
  - `NEXT_PUBLIC_APP_NAME` (`Khai Space Hub`)
  - `NEXT_PUBLIC_APP_URL` (`https://hub.khaispace.com`)
  - `NEXT_PUBLIC_SUPABASE_URL` (`https://dpicdhjaabfjbvppmsxk.supabase.co`)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public anon key)

---

## 2. Data Relationships & Cascade Rules
All operational tables are scoped by `workspace_id` referencing `public.workspaces(id) ON DELETE CASCADE`:
- `projects` → `milestones` (`ON DELETE CASCADE`)
- `projects` → `tasks` (`ON DELETE CASCADE`)
- `milestones` → `tasks.milestone_id` (`ON DELETE SET NULL`, safeguarded by `handle_project_deletion_cleanup()` / `handle_milestone_deletion_cleanup()`)
- `projects` → `financial_transactions.project_id` (`ON DELETE SET NULL`)
- `projects` → `ai_subscriptions.assigned_project_id` (`ON DELETE SET NULL`)
- `projects` → `workspace_notes.project_id` (`ON DELETE SET NULL`)
- Archive state (`metadata.archived`, `metadata.archivedAt`) and optional dates (`metadata.startDate`, `metadata.dueDate`) are stored in `projects.metadata` (`jsonb`).

---

## 3. Role Permissions Matrix (RLS Enforced)
| Capability | Owner | Administrator | Member | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| Read workspace records | Yes | Yes | Yes | Yes |
| Create / Edit Projects, Tasks, Milestones, Notes | Yes | Yes | Yes | No |
| Archive / Unarchive Projects | Yes | Yes | Yes | No |
| Create / Edit Transactions & Subscriptions | Yes | Yes | Yes | No |
| Delete Tasks, Milestones, Notes | Yes | Yes | Yes | No |
| Delete Projects, Transactions, Subscriptions | Yes | Yes | No | No |
| Manage Members & Workspace Settings | Yes | Yes | No | No |
| Delete Workspace | Yes | No | No | No |

---

## 4. Backup & Recovery Readiness
- **Current Verified State:** Supabase project `dpicdhjaabfjbvppmsxk` is `ACTIVE_HEALTHY` on PostgreSQL 17.11 (`ap-southeast-1`).
- **Automated Backups / PITR Note:** On Supabase Free-tier projects, Point-in-Time Recovery (PITR) is not enabled by default and automated daily backups depend on the active Supabase billing plan. Do **not** assume PITR is active unless upgraded to Pro + PITR add-on in the Supabase Dashboard.
- **Recommended Manual Backup Procedure (`pg_dump`):**
  Run periodically or before any major migration using PostgreSQL 17 `pg_dump` (without committing dumps or passwords):
  ```bash
  pg_dump "postgresql://postgres.<ref>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" \
    --format=custom --no-owner --no-privileges \
    --file="khaispace-hub-backup-$(date +%Y%m%d).dump"
  ```
- **Accidental Deletion Recovery:**
  1. For projects, prefer **Archive** over **Delete** so tasks and milestones remain intact.
  2. If a record is deleted, restore from the latest `.dump` into an isolated staging database (`pg_restore`), verify rows, and re-insert only the affected workspace records.

---

## 5. Future Module Foundations (Phase 6 Roadmap)
These modules are intentionally omitted from production navigation until dedicated schemas and workflows are needed:
1. **Content Studio:** Planned tables `content_items` (`workspace_id`, `project_id`, `title`, `platform`, `stage` [`Idea`, `Draft`, `Review`, `Scheduled`, `Published`], `publish_date`, `body`).
2. **3D Printing Commerce:** Planned tables `commerce_products`, `commerce_inventory`, `commerce_orders`, and `commerce_order_items` linked to `financial_transactions` for automated COGS/margin calculation.
3. **KAI Assistant Integration:** Read-only, workspace-scoped server-side edge function (`supabase/functions/kai-brief`) summarizing overdue tasks, upcoming milestones, and monthly burn—strictly requiring authenticated user JWT validation and explicit user opt-in before sending workspace data to any LLM endpoint.


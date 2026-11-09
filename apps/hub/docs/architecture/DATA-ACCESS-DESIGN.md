# Khai Space Hub — Data Access Layer & Application Integration Design
**Document Version:** 1.1.0 (Phase 3.1 Standardized UUIDs)  
**Phase:** Phase 3.1 Security & Architecture Correction Pass  
**Application Target:** `apps/hub/`  
**Working Branch:** `feature/khai-space-hub`  
**Repository:** `khairultajudin/khaispace`

---

## 1. Data Access Philosophy & Directory Structure

To transition Khai Space Hub from in-memory React session state to a persistent Supabase backend without disrupting existing UI components, we design a clean, modular **Service & Repository Pattern**.

### Proposed Directory Layout under `apps/hub/src/`

```
apps/hub/src/
├── lib/
│   └── supabase/
│       ├── client.ts              # Browser Supabase client singleton (@supabase/supabase-js)
│       └── session.ts             # Session management & token storage helpers
├── types/
│   ├── dashboard.ts               # Existing domain model types (preserved & expanded)
│   └── database.types.ts          # Auto-generated Supabase PostgreSQL schema types
├── services/                      # Strongly-typed repository services (PostgREST queries)
│   ├── projects-service.ts
│   ├── tasks-service.ts
│   ├── finance-service.ts
│   ├── subscriptions-service.ts
│   ├── notes-service.ts
│   ├── members-service.ts
│   └── settings-service.ts
├── hooks/                         # React state & synchronization hooks
│   ├── use-workspace.ts           # Current active workspace context
│   ├── use-projects.ts            # Query & optimistic mutation hooks
│   ├── use-tasks.ts
│   ├── use-finance.ts
│   ├── use-subscriptions.ts
│   ├── use-notes.ts
│   └── use-members.ts
├── data/
│   └── sample-dashboard-data.ts   # Preserved development seed / demo fallback data
└── components/                    # Existing UI views (ProjectsView, TasksView, etc.)
```

---

## 2. Supabase Client Initialization (Static Export Compatible)

In Next.js static export (`output: "export"`), there is no Node.js/Edge server runtime running at request time. Therefore, server cookies, server actions, and `@supabase/ssr` server helpers are unnecessary.

The application initializes a standard, lightweight `@supabase/supabase-js` client configured for browser `localStorage` session persistence:

### Browser Client Singleton (`apps/hub/src/lib/supabase/client.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';

let clientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.'
    );
  }

  clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

  return clientInstance;
}
```

---

## 3. Standardized UUID Mapping & Service Operations

All entities are identified by standard PostgreSQL UUID primary keys. For engineering projects, human-readable slugs (`biztrack`, `smart-agro-telemetry`) are indexed uniquely within each workspace for clean URL deep-linking (`#project-<slug>`).

### 3.1 Mapping Existing In-Memory State to Database Operations

| Module | Current State Action | Future Database Service Call | Target PostgreSQL Query / View |
|:---|:---|:---|:---|
| **Workspaces** | Initial provisioning | `workspaceService.provisionWorkspace(name)` | `SELECT create_workspace_with_owner($1);` |
| **Projects** | Load project catalog | `projectsService.getProjects(workspaceId)` | `SELECT * FROM projects WHERE workspace_id = $1 ORDER BY title ASC;` |
| | Save new project | `projectsService.createProject(workspaceId, payload)`| `INSERT INTO projects (workspace_id, slug, title, category, ...) VALUES (...);` |
| | Deep link resolution | `projectsService.getProjectBySlug(workspaceId, slug)`| `SELECT * FROM projects WHERE workspace_id = $1 AND slug = $2;` |
| **Tasks** | Load task list | `tasksService.getTasks(workspaceId)` | `SELECT t.*, p.title as project_title, m.title as milestone_title FROM tasks t JOIN projects p ON t.project_id = p.id ...` |
| | Toggle task status | `tasksService.updateTaskStatus(taskId, status)` | `UPDATE tasks SET status = $1, updated_at = now() WHERE id = $2;` |
| **Milestones** | Load milestones | `tasksService.getMilestones(workspaceId)` | `SELECT m.*, p.title as project_title FROM milestones m JOIN projects p ON m.project_id = p.id ...` |
| **Finance** | Overview KPI rollups | `financeService.getOverviewKPIs(workspaceId)` | `SELECT * FROM view_overall_finance_kpis WHERE workspace_id = $1;` |
| | Project finance breakdown | `financeService.getProjectSummaries(workspaceId)` | `SELECT * FROM view_project_finance_summary WHERE workspace_id = $1;` |
| | Monthly trend chart | `financeService.getMonthlyTrends(workspaceId)` | `SELECT * FROM view_monthly_financial_trends WHERE workspace_id = $1;` |
| | Log transaction | `financeService.createTransaction(workspaceId, data)` | `INSERT INTO financial_transactions (workspace_id, amount, type, is_investment_return, ...) VALUES (...);` |
| **Subscriptions** | Subscriptions directory | `subscriptionsService.getSubscriptions(workspaceId)` | `SELECT * FROM ai_subscriptions WHERE workspace_id = $1 ORDER BY product_name ASC;` |
| **Notes** | Notes & Decisions load | `notesService.getNotes(workspaceId)` | `SELECT * FROM workspace_notes WHERE workspace_id = $1 ORDER BY updated_at DESC;` |
| | Update decision status | `notesService.updateDecision(id, status, ...)` | `UPDATE workspace_notes SET decision_status = $1, ... WHERE id = $2;` |
| **Members** | Roster list | `membersService.getMembers(workspaceId)` | `SELECT wm.*, p.full_name, p.email, p.bio FROM workspace_members wm JOIN profiles p ON wm.user_id = p.id ...` |
| | Suspend member | `membersService.setMemberStatus(memberId, status)` | `UPDATE workspace_members SET status = $1 WHERE id = $2;` |

---

## 4. Production Safeguards Against Destructive Resets

In production environments (`NEXT_PUBLIC_APP_ENV="production"`):
- All "Reset Baseline" and "Reset to Defaults" buttons are **permanently removed from the UI DOM**.
- The database schema enforces that only local development instances with `NEXT_PUBLIC_ENABLE_DEMO_SEED="true"` can trigger the mock seed script (`seed-draft.sql`).
- Brand-new production workspaces display elegant empty states with explicit creation prompts rather than sample mock rows.

# Khai Space Hub — Data Access Layer & Application Integration Design
**Document Version:** 1.2.0 (Phase 3.2 Integrity & Provisioning Safeguards)  
**Phase:** Phase 3.2 Final Database Integrity & Security Correction  
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
│   ├── workspace-service.ts       # Workspace provisioning, deletion & settings
│   ├── projects-service.ts
│   ├── tasks-service.ts
│   ├── finance-service.ts
│   ├── subscriptions-service.ts
│   ├── notes-service.ts
│   ├── members-service.ts         # Member roster & invitation management
│   └── activity-service.ts        # Trusted activity logging procedure calls
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

## 3. Standardized Operations & Service Contracts

All entities use PostgreSQL UUID primary keys, with `projects.slug` indexed for URL deep-linking (`#project-<slug>`).

### 3.1 Mapping Existing In-Memory State to Database Operations

| Module | Current State Action | Target Service Call | Target PostgreSQL Query / Function |
|:---|:---|:---|:---|
| **Workspaces** | Initial provisioning | `workspaceService.createWorkspace(name)` | `SELECT create_workspace_with_owner($1, $2, $3);` (Atomic RPC) |
| | Workspace deletion | `workspaceService.deleteWorkspace(workspaceId)` | `SELECT delete_workspace_by_owner($1);` (Owner-only RPC) |
| **Members** | Roster list | `membersService.getMembers(workspaceId)` | `SELECT wm.*, p.full_name, p.email, p.bio FROM workspace_members wm JOIN profiles p ON wm.user_id = p.id ...` |
| | Send invitation | `membersService.inviteMember(wsId, email, role)` | `INSERT INTO workspace_invitations (workspace_id, email, role, token_hash, ...) VALUES (...)` |
| | Accept invitation | `membersService.acceptInvitation(token)` | `SELECT accept_workspace_invitation($1);` (Identity-verified RPC) |
| | Remove member | `membersService.removeMember(memberId)` | `DELETE FROM workspace_members WHERE id = $1;` (Non-owner target) |
| **Projects** | Load catalog | `projectsService.getProjects(workspaceId)` | `SELECT * FROM projects WHERE workspace_id = $1 ORDER BY title ASC;` |
| | Save new project | `projectsService.createProject(workspaceId, payload)`| `INSERT INTO projects (workspace_id, slug, title, category, ...) VALUES (...);` |
| | Delete project | `projectsService.deleteProject(projectId)` | `DELETE FROM projects WHERE id = $1;` (Safely cascades & cleans up) |
| **Tasks** | Load task list | `tasksService.getTasks(workspaceId)` | `SELECT t.*, p.title as project_title, m.title as milestone_title FROM tasks t JOIN projects p ON t.project_id = p.id ...` |
| | Delete milestone | `tasksService.deleteMilestone(milestoneId)` | `DELETE FROM milestones WHERE id = $1;` (Nullifies `tasks.milestone_id`) |
| **Finance** | Overview KPI rollups | `financeService.getOverviewKPIs(workspaceId)` | `SELECT * FROM view_overall_finance_kpis WHERE workspace_id = $1;` |
| | Project finance | `financeService.getProjectSummaries(workspaceId)` | `SELECT * FROM view_project_finance_summary WHERE workspace_id = $1;` |
| | Log transaction | `financeService.createTransaction(workspaceId, data)` | `INSERT INTO financial_transactions (workspace_id, amount, type, is_investment_return, ...) VALUES (...);` |
| **Subscriptions** | Subscriptions load | `subscriptionsService.getSubscriptions(workspaceId)` | `SELECT * FROM ai_subscriptions WHERE workspace_id = $1 ORDER BY product_name ASC;` |
| **Notes** | Notes & Decisions load | `notesService.getNotes(workspaceId)` | `SELECT * FROM workspace_notes WHERE workspace_id = $1 ORDER BY updated_at DESC;` |
| **Activity** | Record UI event | `activityService.logActivity(wsId, action, ...)` | `SELECT log_workspace_activity($1, $2, $3, $4, $5, $6);` (Validated RPC) |

---

## 4. Production Safeguards Against Destructive Resets

In production environments (`NEXT_PUBLIC_APP_ENV="production"`):
- All "Reset Baseline" and "Reset to Defaults" buttons are **permanently removed from the UI DOM**.
- The database schema enforces that only local development instances with `NEXT_PUBLIC_ENABLE_DEMO_SEED="true"` can trigger the mock seed script (`seed-draft.sql`).
- Brand-new production workspaces display elegant empty states with explicit creation prompts rather than sample mock rows.

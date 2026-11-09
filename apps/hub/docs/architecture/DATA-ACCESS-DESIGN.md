# Khai Space Hub — Data Access Layer & Application Integration Design
**Document Version:** 1.0.0  
**Phase:** Phase 3 Architecture & Persistence Planning  
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
│       ├── client.ts              # Browser Supabase client singleton
│       └── server.ts              # Optional server-side utility (Edge Functions / SSR)
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

## 2. Supabase Client Initialization & Environment Configuration

### 2.1 Browser Client Singleton (`apps/hub/src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/database.types';

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.'
    );
  }

  clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return clientInstance;
}
```

### 2.2 Environment Variables Standard (`.env.example`)
```bash
# Public variables exposed to static export client
NEXT_PUBLIC_SUPABASE_URL="https://your-hub-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."

# Application configuration flags
NEXT_PUBLIC_APP_ENV="production" # "development" | "production"
NEXT_PUBLIC_ENABLE_DEMO_SEED="false" # "true" allowed only in local dev
```

---

## 3. Mapping Existing In-Memory State to Future Database Operations

### 3.1 Projects Module
| Current React State Action | Future Database Service Call | Target PostgreSQL Operation |
|:---|:---|:---|
| Initial load of `SAMPLE_PROJECTS` | `projectsService.getProjects(workspaceId)` | `SELECT * FROM projects WHERE workspace_id = $1 ORDER BY title ASC;` |
| Filter by category or status | PostgREST URL filter in service | `SELECT * FROM projects WHERE workspace_id = $1 AND status = $2;` |
| Save new project (`handleSave`) | `projectsService.createProject(workspaceId, payload)` | `INSERT INTO projects (workspace_id, title, category, ...) VALUES (...);` |
| Edit existing project (`handleSave`) | `projectsService.updateProject(projectId, payload)` | `UPDATE projects SET title = $1, ... WHERE id = $2 AND workspace_id = $3;` |
| Delete project | `projectsService.deleteProject(projectId)` | `DELETE FROM projects WHERE id = $1 AND workspace_id = $2;` |

### 3.2 Tasks & Milestones Module
| Current React State Action | Future Database Service Call | Target PostgreSQL Operation |
|:---|:---|:---|
| Initial load of `SAMPLE_TASKS` | `tasksService.getTasks(workspaceId)` | `SELECT t.*, p.title as project_title, m.title as milestone_title FROM tasks t JOIN projects p ...` |
| Initial load of `SAMPLE_MILESTONES`| `tasksService.getMilestones(workspaceId)` | `SELECT m.*, p.title as project_title FROM milestones m JOIN projects p ...` |
| Toggle task status (In Progress -> Completed)| `tasksService.updateTaskStatus(taskId, status)` | `UPDATE tasks SET status = $1, updated_at = now() WHERE id = $2;` |
| Dynamic Overdue check | Computed dynamically on client vs local date | Query fetches raw `due_date`; client checks `due_date < today && status != 'Completed'` |
| Create milestone | `tasksService.createMilestone(workspaceId, payload)` | `INSERT INTO milestones (workspace_id, project_id, title, target_date, ...) VALUES (...);` |

### 3.3 Finance & ROI Module
| Current React State Action | Future Database Service Call | Target PostgreSQL Operation |
|:---|:---|:---|
| Financial Overview KPI calculation | `financeService.getOverviewKPIs(workspaceId)` | `SELECT * FROM view_overall_finance_kpis WHERE workspace_id = $1;` |
| Project Finance breakdown table | `financeService.getProjectSummaries(workspaceId)`| `SELECT * FROM view_project_finance_summary WHERE workspace_id = $1;` |
| Monthly Cashflow trends chart | `financeService.getMonthlyTrends(workspaceId)` | `SELECT * FROM view_monthly_financial_trends WHERE workspace_id = $1;` |
| Create transaction (`handleSave`) | `financeService.createTransaction(workspaceId, payload)`| `INSERT INTO financial_transactions (workspace_id, amount, type, is_investment_return, ...) VALUES (...);` |
| Filter transactions (Income/Expense/Investment)| Service filter parameters | `SELECT * FROM financial_transactions WHERE workspace_id = $1 AND type = $2 ORDER BY transaction_date DESC;` |

### 3.4 AI Subscriptions Module
| Current React State Action | Future Database Service Call | Target PostgreSQL Operation |
|:---|:---|:---|
| Subscription directory load | `subscriptionsService.getSubscriptions(workspaceId)`| `SELECT * FROM ai_subscriptions WHERE workspace_id = $1 ORDER BY product_name ASC;` |
| Active commitments & cost rollups | Client utility or database view | Computes monthly/annual equivalent using `getMonthlyEquivalent()` |
| Upcoming renewals (< 30 days) | `subscriptionsService.getUpcomingRenewals(workspaceId)` | `SELECT * FROM ai_subscriptions WHERE workspace_id = $1 AND status = 'Active' AND next_billing_date <= (current_date + interval '30 days');` |
| Add / edit subscription | `subscriptionsService.saveSubscription(workspaceId, data)`| `INSERT INTO ai_subscriptions ...` or `UPDATE ai_subscriptions ...` |

### 3.5 Notes & Decisions Module
| Current React State Action | Future Database Service Call | Target PostgreSQL Operation |
|:---|:---|:---|
| Notes & Decisions directory load | `notesService.getNotes(workspaceId)` | `SELECT * FROM workspace_notes WHERE workspace_id = $1 ORDER BY updated_at DESC;` |
| Save new Note or Decision | `notesService.createNote(workspaceId, payload)` | `INSERT INTO workspace_notes (workspace_id, type, title, content, ...) VALUES (...);` |
| Update existing record | `notesService.updateNote(noteId, payload)` | `UPDATE workspace_notes SET title = $1, content = $2 WHERE id = $3;` (Trigger prohibits type shift) |
| Deep-link routing (`#note-<id>`, `#decision-<id>`)| `notesService.getNoteById(noteId)` | `SELECT * FROM workspace_notes WHERE id = $1 AND workspace_id = $2;` |

### 3.6 Members & Settings Module
| Current React State Action | Future Database Service Call | Target PostgreSQL Operation |
|:---|:---|:---|
| Member Directory roster load | `membersService.getMembers(workspaceId)` | `SELECT wm.*, p.full_name, p.email, p.bio FROM workspace_members wm JOIN profiles p ...` |
| Update Owner profile | `membersService.updateProfile(userId, profileData)`| `UPDATE profiles SET full_name = $1, bio = $2 ... WHERE id = $3;` |
| Suspend / Reactivate collaborator | `membersService.setMemberStatus(memberId, status)` | `UPDATE workspace_members SET status = $1 WHERE id = $2;` |
| Update workspace parameters | `settingsService.updateSettings(workspaceId, data)` | `UPDATE workspaces SET name = $1, ... WHERE id = $2;` |
| Toggle notification preferences | `settingsService.updateNotifications(workspaceId, flags)`| `UPDATE workspace_settings SET notification_task_reminders = $1 ... WHERE workspace_id = $2;` |

---

## 4. Separation of Demo/Sample Data from Real Production Data

### 4.1 The Production Danger of "Reset Baseline"
In the existing prototype, every module features a "Reset Baseline" or "Reset to Defaults" button that immediately replaces in-memory state with sample datasets (`SAMPLE_PROJECTS`, `SAMPLE_TASKS`, etc.).

**In a persistent database environment, allowing users to execute "Reset Baseline" would cause catastrophic accidental data loss by overwriting real business transactions, tasks, and collaborator records.**

### 4.2 Production Safeguards & Demo Mode Architecture
To prevent accidental destruction of production data:
1. **Environment Flag:**
   ```typescript
   export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === 'true';
   ```
2. **Conditional Rendering of Reset Controls:**
   - In production (`NEXT_PUBLIC_APP_ENV="production"`), the "Reset Baseline" buttons in module headers and settings views are **completely hidden from the UI**.
   - In local development (`NEXT_PUBLIC_APP_ENV="development"`), the button is clearly badged: `Development: Seed Sample Data` and calls an isolated development seeding function.
3. **Empty State Architecture:**
   - When a new real workspace is initialized, modules display elegant, production-grade empty states with actionable "Create your first task", "Add project", or "Record transaction" callouts rather than injecting fictional placeholder rows.
4. **Permanent Offline Demonstration:**
   - `sample-dashboard-data.ts` remains permanently in the repository as a mock fixtures file for offline unit tests, Storybook/component development, and automated CI pipelines.

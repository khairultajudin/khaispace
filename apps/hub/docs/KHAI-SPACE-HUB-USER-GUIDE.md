# Khai Space Hub — Owner Operating Guide

**Production URL:** https://hub.khaispace.com  
**Workspace Model:** Multi-tenant PostgreSQL 17 with Row Level Security (RLS)

---

## 1. Signing In & Security
Khai Space Hub uses two layers of protection:
1. **Cloudflare Access (Layer 1):** Protects `hub.khaispace.com` at the network edge for authorized owner email (`khairultajudin13@gmail.com`). Sessions last 24 hours.
2. **Supabase Auth (Layer 2):** Primary login uses **Email + Password** (`Login`).
   - Click the eye icon to show/hide your password.
   - Use **Forgot Password?** to send a recovery email that links to `/auth/callback?next=/reset-password` and lets you set a new password.
   - Public self-registration is disabled (`shouldCreateUser: false`).

---

## 2. Global Search (`Ctrl+K` / `Cmd+K`)
Click **Search** in the top header (or press `Ctrl+K` / `Cmd+K`) from anywhere in the Hub to search across Projects, Tasks, Milestones, Financial Transactions, AI Subscriptions, and Notes & Decisions, and jump directly to any item.

---

## 3. Core Modules

### A. Overview Dashboard
- **Welcome & Quick Jump:** Displays today's date, active workspace, role, currency (`MYR`), and quick-jump buttons to every module.
- **Executive Summary Cards:** Live counts for active/archived projects, open/overdue tasks, net cashflow (`MYR`), and normalized monthly AI subscription spend. Click any card to open its module.
- **Workspace Projects & Recent Activity:** Shows up to 6 active (non-archived) projects, recent workspace activity logs, and upcoming/overdue tasks.

### B. Projects
- **Create:** Click **New Project**, enter Project Name, Category, Status (`Planning`, `In Development`, `Active`, `Production`, `Documented`), optional Start/Due Dates, Location/Path, Summary Description, and Tags.
- **Edit:** Open the **three-dot menu (`⋮`)** on a project card or click **Edit Project** inside the project detail page.
- **Archive / Unarchive:** Use **Archive Project** to move completed or inactive projects out of the active listing and Overview metrics while preserving all linked tasks, milestones, and financial history. Switch to the **Archived** tab to view or **Unarchive Project**.
- **Delete (Owner / Administrator only):** Opens a confirmation dialog showing live dependency counts:
  - **Permanently deleted:** Linked Tasks and Milestones (`ON DELETE CASCADE`).
  - **Preserved & unlinked:** Financial Transactions, AI Subscriptions, and Workspace Notes (`ON DELETE SET NULL`).
- **Project Detail:** Displays architecture metadata, dates, and live **Connected Records** (linked Tasks, Milestones, Finance summary, AI Subscriptions, and Notes).

### C. Tasks & Milestones
- **Views:** Switch between **Grid** view and **Board** (Kanban columns: `Pending`, `In Progress`, `Completed`), plus quick filter pills (`All Tasks`, `Overdue`, `Upcoming`, `Completed`).
- **Tasks:** Create, Edit, Delete, update status inline, and optionally link each task to a Project Milestone. Overdue tasks are highlighted automatically.
- **Milestones:** Switch to the **Project Milestones** tab to Create, Edit, update status (`Planned`, `In Progress`, `Completed`), or Delete milestones. Progress bars calculate completion automatically from linked tasks. Deleting a milestone preserves linked tasks.

### D. Finance & ROI
- Track **Income**, **Expense**, and **Investment** transactions in `MYR`, optionally attributed to any live workspace project.
- View **Overview**, **Transactions** ledger (searchable/filterable), **Project Economics & ROI**, and **Monthly Trends**.
- Deleting transactions is restricted to **Owner** and **Administrator**.

### E. AI Subscriptions
- Track AI tools/providers, plans, Monthly/Annual billing cycles, renewal dates, and optional project assignment.
- Automatically computes normalized monthly equivalent spend and annual totals separately from actual ledger transactions.
- Deleting subscriptions is restricted to **Owner** and **Administrator**.

### F. Notes & Decisions
- **Workspace Notes:** General engineering notes, documentation, and operational logs linked to projects or the general workspace.
- **Decision Register:** Formal architectural/business decisions capturing Status (`Proposed`, `Accepted`, `Superseded`, `Rejected`), Rationale, and Expected Impact.

### G. Members & Settings
- **Members:** View workspace roster, invite members (Owner/Administrator), or adjust member roles.
- **Profile:** Update your display name, full name, bio, location, and timezone (`Asia/Kuala_Lumpur`).
- **Workspace Settings:** Configure workspace name, description, timezone, currency, and notification preferences.


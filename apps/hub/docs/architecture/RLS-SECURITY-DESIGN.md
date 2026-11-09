# Khai Space Hub — Row Level Security (RLS) & Multi-Tenant Security Design
**Document Version:** 1.1.0 (Phase 3.1 Security Hardened)  
**Phase:** Phase 3.1 Security & Architecture Correction Pass  
**Application Target:** `apps/hub/`  
**Working Branch:** `feature/khai-space-hub`  
**Repository:** `khairultajudin/khaispace`

---

## 1. Security Philosophy & The Defense-in-Depth Model

Khai Space Hub adopts a strict **Zero-Trust Client** security architecture. Because the frontend is a statically compiled Single-Page Application communicating directly with Supabase PostgREST, client-side JavaScript checks cannot be relied upon as security boundaries.

### Core Security Rules
1. **Never Trust Client Workspace Headers:** A user must never be allowed to access or mutate records in a workspace simply by passing a `workspace_id` in the JSON payload or query parameters.
2. **PostgreSQL as Enforcer:** Row Level Security (RLS) evaluates every query against `auth.uid()`, verifying that the requesting user holds an active, non-suspended membership in the target workspace.
3. **Suspended Means Inactive:** Collaborators whose status is `'Suspended'` or `'Pending'` are blocked from reading or writing any workspace data.
4. **Viewer Role is Strictly Read-Only:** Users with the `'Viewer'` role can execute `SELECT` queries but are rejected on `INSERT`, `UPDATE`, and `DELETE`.
5. **No Service-Role Key in the Browser:** The Supabase Service Role Key is strictly banned from client code, environment variables, and build outputs.
6. **Strict Anti-Privilege Escalation:** Administrators can never promote themselves to Owner, assign the Owner role, or alter the Owner's records.

---

## 2. Hardened Owner & Administrator Role Model

### 2.1 The Single-Owner Constraint
A workspace represents a private command center. To prevent split ownership, hostile takeovers, or administrative deadlock:
- **Rule:** A workspace has **exactly one Owner**.
- **Database Engine Guarantee:**
  ```sql
  CREATE UNIQUE INDEX idx_workspace_single_owner 
    ON public.workspace_members (workspace_id) 
    WHERE (role = 'Owner');
  ```
- **Ownership Transfer Policy:** Ownership transfer is **explicitly prohibited** in this version. The Owner record cannot have its `user_id`, `role`, or `status` modified.

### 2.2 Administrator Privilege Restrictions
In Phase 3, a generic policy `Admins manage roster FOR ALL` inadvertently allowed an Administrator to self-promote or alter the Owner. In Phase 3.1, this vulnerability is completely eliminated through granular RLS policies and trigger enforcement:

1. **No Owner Role Assignment:** An Administrator **cannot insert** a member with `role = 'Owner'` (`WITH CHECK (role != 'Owner')`).
2. **No Self-Promotion:** An Administrator **cannot update their own row** in `workspace_members` (`USING (user_id != auth.uid())`).
3. **No Owner Modification:** An Administrator **cannot update or delete the Owner** (`USING (role != 'Owner')`).
4. **No Administrator Demotion by Admins:** An Administrator can only delete/remove `Member` or `Viewer` roles; only the `Owner` can remove another Administrator.

---

## 3. The Recursive RLS Policy Trap & Architectural Solution

### 3.1 The Problem: Infinite Policy Recursion
In a multi-tenant PostgreSQL RLS design, protecting `workspace_members` with a policy like this:
```sql
-- DANGEROUS: Causes Infinite Recursion
CREATE POLICY member_access ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```
causes PostgreSQL to re-evaluate the policy while executing the subquery on `workspace_members`, resulting in an infinite recursion error (`error: infinite recursion detected in policy for relation "workspace_members"`).

### 3.2 The Solution: Fast `SECURITY DEFINER` Helper Functions
To eliminate recursion and optimize policy evaluation performance, three PostgreSQL helper functions are defined with `SECURITY DEFINER`, `STABLE` caching, and a fixed, secure `search_path`:

```sql
-- Helper 1: Check active non-suspended membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = auth.uid() 
      AND status = 'Active'
  );
$$;

-- Helper 2: Retrieve user's role in a workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(ws_id uuid)
RETURNS public.member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT role 
  FROM public.workspace_members 
  WHERE workspace_id = ws_id 
    AND user_id = auth.uid() 
    AND status = 'Active';
$$;

-- Helper 3: Check if user is Workspace Admin or Owner
CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = auth.uid() 
      AND role IN ('Owner', 'Administrator')
      AND status = 'Active'
  );
$$;

-- Revoke anonymous access; grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_workspace_role(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_workspace_role(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_workspace_admin_or_owner(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin_or_owner(uuid) TO authenticated;
```

---

## 4. Secure Initial Workspace & Owner Provisioning

To prevent arbitrary authenticated users from inserting unauthorized `Owner` rows or claiming existing workspaces, initial workspace setup is wrapped in an atomic, security-definer stored procedure:

```sql
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  ws_name varchar(100),
  ws_description text DEFAULT '',
  ws_timezone varchar(50) DEFAULT 'Asia/Kuala_Lumpur (GMT+8)'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  new_ws_id uuid;
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: caller must be authenticated.';
  END IF;

  -- 1. Atomically Create Workspace
  INSERT INTO public.workspaces (name, description, timezone, created_by)
  VALUES (ws_name, ws_description, ws_timezone, caller_id)
  RETURNING id INTO new_ws_id;

  -- 2. Atomically Provision Initial Owner Membership
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (new_ws_id, caller_id, 'Owner', 'Active');

  -- 3. Atomically Initialize Workspace Settings
  INSERT INTO public.workspace_settings (workspace_id)
  VALUES (new_ws_id);

  RETURN new_ws_id;
END;
$$;
```

---

## 5. Comprehensive RLS Policy Matrix

RLS is enabled explicitly on every table: `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.

| Table | Operation | Target Role | Policy Rule (`USING` / `WITH CHECK`) | Security Objective |
|:---|:---:|:---:|:---|:---|
| **`profiles`** | SELECT | Authenticated | `id = auth.uid() OR EXISTS (SELECT 1 FROM workspace_members wm1 JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id AND wm1.status = 'Active')` | Read own profile and profiles of active co-members in shared workspaces. |
| | INSERT | Self | `id = auth.uid()` | Users can only register their own profile row. |
| | UPDATE | Self | `id = auth.uid()` | Users can only modify their own profile attributes. |
| | DELETE | None | Disallowed (Managed via Supabase Auth) | Prevents dangling profile records. |
| **`workspaces`** | SELECT | Member | `public.is_workspace_member(id)` | Only active members see the workspace. |
| | UPDATE | Admin / Owner | `public.is_workspace_admin_or_owner(id)` | Configuration changes limited to Admins/Owners. |
| | INSERT | None | Executed via `create_workspace_with_owner` | Direct table insert blocked to enforce atomic owner setup. |
| | DELETE | Owner Only | `public.get_user_workspace_role(id) = 'Owner'` | Only the verified Owner can delete a workspace. |
| **`workspace_members`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Active members see collaborator roster. |
| | INSERT | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id) AND role != 'Owner'` | **Anti-Escalation:** Cannot insert Owner role. |
| | UPDATE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id) AND role != 'Owner' AND user_id != auth.uid()` | **Anti-Escalation:** Admins cannot update Owner or self-promote. |
| | DELETE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id) AND role != 'Owner' AND (public.get_user_workspace_role(workspace_id) = 'Owner' OR role IN ('Member', 'Viewer'))` | **Anti-Escalation:** Admins cannot remove Owner or peer Admins. |
| **`workspace_invitations`**| SELECT | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id)` | View pending invitations. |
| | INSERT | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id) AND role != 'Owner'` | Cannot invite as Owner. |
| | UPDATE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id)` | Update or revoke invitation. |
| | DELETE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id)` | Delete invitation record. |
| **`workspace_settings`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Active members read notification flags. |
| | UPDATE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id)` | Admins configure notification flags. |
| **`projects`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Workspace-scoped catalog read. |
| | INSERT / UPDATE | Member + | `public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer'` | Viewers blocked from writing. |
| | DELETE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id)` | Deletions reserved for Admins/Owners. |
| **`milestones`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Workspace-scoped milestone read. |
| | ALL (Write) | Member + | `public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer'` | Standard write permissions for collaborators. |
| **`tasks`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Workspace-scoped task read. |
| | ALL (Write) | Member + | `public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer'` | Standard write permissions for collaborators. |
| **`financial_transactions`**| SELECT | Member | `public.is_workspace_member(workspace_id)` | Workspace-scoped ledger read. |
| | INSERT / UPDATE | Member + | `public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer'` | Collaborators can record transactions. |
| | DELETE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id)` | Deletions guarded to preserve financial audit trail. |
| **`ai_subscriptions`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Workspace-scoped license read. |
| | INSERT / UPDATE | Member + | `public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer'` | Collaborators can add/edit licenses. |
| | DELETE | Admin / Owner | `public.is_workspace_admin_or_owner(workspace_id)` | License deletion guarded. |
| **`workspace_notes`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Workspace-scoped notes read. |
| | INSERT / UPDATE | Member + | `public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer'` | Collaborators can create notes/decisions. |
| | DELETE | Member + | `public.is_workspace_member(workspace_id) AND public.get_user_workspace_role(workspace_id) != 'Viewer'` | Collaborators can prune notes. |
| **`activity_logs`** | SELECT | Member | `public.is_workspace_member(workspace_id)` | Workspace-scoped audit view. |
| | INSERT | Member | `public.is_workspace_member(workspace_id) AND user_id = auth.uid()` | **Anti-Forgery:** Can only insert own audit events. |
| | UPDATE / DELETE | None | Disallowed (No policy created) | **Immutable Audit Log:** Zero updates/deletions allowed. |

---

## 6. SQL View Security (`security_invoker = true`)

In PostgreSQL, standard SQL views run with the privileges of the view's creator (`security_definer` semantics). In an RLS multi-tenant environment, this is dangerous because querying a view could bypass the underlying table RLS!

**Phase 3.1 Hardening:**
All three financial views are created with `WITH (security_invoker = true)`:
```sql
CREATE OR REPLACE VIEW public.view_overall_finance_kpis
WITH (security_invoker = true) AS ...
```
- **Execution Context:** The view executes under the identity and permissions of the calling user (`auth.uid()`).
- **Underlying RLS Inheritance:** PostgreSQL evaluates `financial_transactions` RLS policies for every row processed by the view. A user cannot query aggregations of another workspace's transactions.
- **Grants:** Anonymous access is completely revoked (`REVOKE ALL FROM anon, public; GRANT SELECT TO authenticated;`).

---

## 7. Hardened Owner Protection Trigger

```sql
CREATE OR REPLACE FUNCTION public.protect_workspace_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Prevent physical deletion of the Owner
  IF TG_OP = 'DELETE' AND OLD.role = 'Owner' THEN
    RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be removed.';
  END IF;

  -- 2. Protect existing Owner from mutation
  IF TG_OP = 'UPDATE' AND OLD.role = 'Owner' THEN
    IF NEW.role != 'Owner' THEN
      RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be demoted.';
    END IF;
    IF NEW.status != 'Active' THEN
      RAISE EXCEPTION 'Security Policy Violation: The workspace Owner cannot be suspended.';
    END IF;
    IF NEW.user_id != OLD.user_id THEN
      RAISE EXCEPTION 'Security Policy Violation: Workspace ownership cannot be transferred by mutating user_id.';
    END IF;
    IF NEW.workspace_id != OLD.workspace_id THEN
      RAISE EXCEPTION 'Security Policy Violation: Owner record workspace_id cannot be altered.';
    END IF;
  END IF;

  -- 3. Prevent promoting non-owners to Owner (Ownership transfer prohibited)
  IF TG_OP = 'UPDATE' AND OLD.role != 'Owner' AND NEW.role = 'Owner' THEN
    RAISE EXCEPTION 'Security Policy Violation: Promoting a member to Owner is prohibited in this version.';
  END IF;

  RETURN NEW;
END;
$$;
```

---

## 8. Audit Log Anti-Forgery Trigger

To prevent users from manually manipulating the `activity_logs` table via direct PostgREST calls:
```sql
CREATE OR REPLACE FUNCTION public.protect_activity_log_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Force trusted server authentication context
  NEW.user_id := auth.uid();
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_log_integrity
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_activity_log_integrity();
```
Even if a compromised client sends a falsified `user_id` or timestamp, the database trigger overrides them with `auth.uid()` and server `now()`.

import { test, expect, type Page } from '@playwright/test';

interface MockProjectRow {
  id: string;
  workspace_id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  location: string;
  description: string;
  full_description: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

function createFakeJwt(userId: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  return `${header}.${payload}.mock-signature`;
}

async function setupMockHubSession(
  page: Page,
  options: {
    role?: 'Owner' | 'Administrator' | 'Member' | 'Viewer';
    initialProjects?: MockProjectRow[];
    dependencyCounts?: { tasks: number; milestones: number };
  } = {}
) {
  const userId = '11111111-1111-4111-8111-111111111111';
  const workspaceId = '22222222-2222-4222-8222-222222222222';
  const email = 'owner@khaispace.com';
  const role = options.role ?? 'Owner';
  const jwt = createFakeJwt(userId, email);

  const projectsDb: MockProjectRow[] = [...(options.initialProjects ?? [])];
  const recordedWorkspaceQueries: string[] = [];

  await page.addInitScript(
    ({ token, uid, mail, wsId }) => {
      window.localStorage.setItem(
        'khaispace-hub-auth',
        JSON.stringify({
          access_token: token,
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: uid,
            email: mail,
            aud: 'authenticated',
            role: 'authenticated',
          },
        })
      );
      window.localStorage.setItem('khaispace-hub-active-workspace', wsId);
    },
    { token: jwt, uid: userId, mail: email, wsId: workspaceId }
  );

  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: userId, email, aud: 'authenticated', role: 'authenticated' }),
    });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/rest/v1/')[1] ?? '';
    const method = req.method();

    if (table === 'workspace_members') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            role,
            status: 'Active',
            workspaces: {
              id: workspaceId,
              name: 'Khai Space HQ',
              description: 'Primary Workspace',
              timezone: 'Asia/Kuala_Lumpur',
              default_currency: 'MYR',
              date_format: 'DD/MM/YYYY',
              content_density: 'Comfortable',
            },
          },
        ]),
      });
      return;
    }

    if (table === 'projects') {
      const wsFilter = url.searchParams.get('workspace_id');
      if (wsFilter) recordedWorkspaceQueries.push(wsFilter);

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projectsDb),
        });
        return;
      }

      if (method === 'POST') {
        const body = req.postDataJSON() as Partial<MockProjectRow>;
        const created: MockProjectRow = {
          id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          workspace_id: workspaceId,
          slug: body.slug ?? 'new-project',
          title: body.title ?? 'Untitled',
          category: body.category ?? 'Engineering',
          status: body.status ?? 'Planning',
          location: body.location ?? '',
          description: body.description ?? '',
          full_description: body.full_description ?? null,
          tags: body.tags ?? [],
          metadata: body.metadata ?? {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userId,
        };
        projectsDb.unshift(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }

      if (method === 'PATCH') {
        const idFilter = (url.searchParams.get('id') ?? '').replace('eq.', '');
        const body = req.postDataJSON() as Partial<MockProjectRow>;
        const idx = projectsDb.findIndex((p) => p.id === idFilter);
        if (idx === -1) {
          await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not found' }) });
          return;
        }
        projectsDb[idx] = {
          ...projectsDb[idx],
          ...body,
          updated_at: new Date().toISOString(),
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projectsDb[idx]),
        });
        return;
      }

      if (method === 'DELETE') {
        const idFilter = (url.searchParams.get('id') ?? '').replace('eq.', '');
        const idx = projectsDb.findIndex((p) => p.id === idFilter);
        if (idx !== -1) projectsDb.splice(idx, 1);
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    // Dependency HEAD count queries for DeleteProjectModal
    if (
      method === 'HEAD' &&
      ['tasks', 'milestones', 'financial_transactions', 'ai_subscriptions', 'workspace_notes'].includes(table)
    ) {
      let count = 0;
      if (table === 'tasks') count = options.dependencyCounts?.tasks ?? 0;
      if (table === 'milestones') count = options.dependencyCounts?.milestones ?? 0;
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'content-range',
          'content-range': count === 0 ? '*/0' : `0-${count - 1}/${count}`,
        },
        body: '',
      });
      return;
    }

    // Other workspace/activity tables return empty arrays cleanly
    await route.fulfill({
      status: method === 'POST' ? 201 : 200,
      contentType: 'application/json',
      body: JSON.stringify(method === 'POST' ? {} : []),
    });
  });

  return { workspaceId, projectsDb, recordedWorkspaceQueries };
}

test.describe('Projects Module — Edit, Archive & Delete Lifecycle E2E', () => {
  test('Create, Edit (name, description, status, dates), persist across reload', async ({ page }) => {
    const { recordedWorkspaceQueries } = await setupMockHubSession(page, { role: 'Owner' });

    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Projects & Workspaces/i })).toBeVisible();

    // 1. Create Project
    await page.getByRole('button', { name: /New Project/i }).click();
    await page.locator('#project-title-input').fill('Alpha Core');
    await page.locator('#project-description-input').fill('Initial project summary.');
    await page.getByRole('button', { name: /^Create Project$/i }).click();

    await expect(page.getByText('Alpha Core')).toBeVisible();
    await expect(page.getByText(/Created project "Alpha Core"/i)).toBeVisible();

    // 2. Edit via card three-dot menu
    await page.getByRole('button', { name: 'Actions for Alpha Core' }).click();
    await page.getByRole('menuitem', { name: /Edit Project/i }).click();

    await expect(page.getByRole('heading', { name: /Edit Project/i })).toBeVisible();
    await expect(page.locator('#project-title-input')).toHaveValue('Alpha Core');

    await page.locator('#project-title-input').fill('Alpha Core v2');
    await page.locator('#project-status-select').selectOption('Production');
    await page.locator('#project-start-date-input').fill('2026-11-01');
    await page.locator('#project-due-date-input').fill('2026-12-15');
    await page.locator('#project-description-input').fill('Updated production architecture summary.');
    await page.getByRole('button', { name: /Save Changes/i }).click();

    await expect(page.getByText('Alpha Core v2')).toBeVisible();
    await expect(page.getByText('Updated production architecture summary.')).toBeVisible();
    await expect(page.getByText(/2026-11-01.*2026-12-15/)).toBeVisible();

    // 3. Reload browser and verify persistence
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText('Alpha Core v2')).toBeVisible();
    await expect(page.getByText('Updated production architecture summary.')).toBeVisible();
    expect(recordedWorkspaceQueries.every((q) => q === 'eq.22222222-2222-4222-8222-222222222222')).toBe(true);
  });

  test('Archive excludes from Active listing, shows in Archived tab, and Unarchive restores', async ({ page }) => {
    await setupMockHubSession(page, {
      role: 'Owner',
      initialProjects: [
        {
          id: 'proj-arch-1',
          workspace_id: '22222222-2222-4222-8222-222222222222',
          slug: 'legacy-portal',
          title: 'Legacy Portal',
          category: 'Engineering',
          status: 'Documented',
          location: 'apps/legacy',
          description: 'Portal scheduled for archival.',
          full_description: null,
          tags: ['ArchiveTest'],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: '11111111-1111-4111-8111-111111111111',
        },
      ],
    });

    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await expect(page.getByText('Legacy Portal')).toBeVisible();

    // Archive via card action menu
    await page.getByRole('button', { name: 'Actions for Legacy Portal' }).click();
    await page.getByRole('menuitem', { name: /Archive Project/i }).click();

    await expect(page.getByText(/Archived project "Legacy Portal"/i)).toBeVisible();
    await expect(page.getByText('No active projects in this workspace yet')).toBeVisible();

    // Switch to Archived view
    await page.getByRole('button', { name: /Archived/i }).click();
    await expect(page.getByRole('button', { name: 'View details for Legacy Portal' })).toBeVisible();

    // Unarchive
    await page.getByRole('button', { name: 'Actions for Legacy Portal' }).click();
    await page.getByRole('menuitem', { name: /Unarchive Project/i }).click();

    await expect(page.getByText(/Restored "Legacy Portal" to active projects/i)).toBeVisible();
    await expect(page.getByText('No archived projects')).toBeVisible();

    // Switch back to Active view
    await page.getByRole('button', { name: /^Active 1$/i }).click();
    await expect(page.getByRole('button', { name: 'View details for Legacy Portal' })).toBeVisible();
  });

  test('Delete confirmation shows cascade dependency impact and deletes cleanly', async ({ page }) => {
    await setupMockHubSession(page, {
      role: 'Owner',
      dependencyCounts: { tasks: 3, milestones: 2 },
      initialProjects: [
        {
          id: 'proj-del-1',
          workspace_id: '22222222-2222-4222-8222-222222222222',
          slug: 'temp-sandbox',
          title: 'Temp Sandbox',
          category: 'Engineering',
          status: 'Planning',
          location: 'apps/temp',
          description: 'Temporary project with dependencies.',
          full_description: null,
          tags: [],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: '11111111-1111-4111-8111-111111111111',
        },
      ],
    });

    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Actions for Temp Sandbox' }).click();
    await page.getByRole('menuitem', { name: /Delete Project/i }).click();

    await expect(page.getByRole('heading', { name: /Delete Project/i })).toBeVisible();
    await expect(page.getByText(/3 tasks and 2 milestones/i)).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: /^Delete Project$/i });
    await expect(confirmBtn).toBeDisabled();

    await page.getByRole('checkbox').check();
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    await expect(page.getByText(/Deleted project "Temp Sandbox"/i)).toBeVisible();
    await expect(page.getByText('No active projects in this workspace yet')).toBeVisible();
  });

  test('Role-based restrictions hide Delete from Member and all write actions from Viewer', async ({ page }) => {
    await setupMockHubSession(page, {
      role: 'Viewer',
      initialProjects: [
        {
          id: 'proj-view-1',
          workspace_id: '22222222-2222-4222-8222-222222222222',
          slug: 'readonly-proj',
          title: 'Readonly Project',
          category: 'Engineering',
          status: 'Active',
          location: 'apps/hub',
          description: 'Viewer should not see write or delete controls.',
          full_description: null,
          tags: [],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: '11111111-1111-4111-8111-111111111111',
        },
      ],
    });

    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await expect(page.getByText('Readonly Project')).toBeVisible();
    await expect(page.getByRole('button', { name: /New Project/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Actions for Readonly Project' })).toHaveCount(0);

    // Member can Edit & Archive, but cannot Delete
    await setupMockHubSession(page, {
      role: 'Member',
      initialProjects: [
        {
          id: 'proj-mem-1',
          workspace_id: '22222222-2222-4222-8222-222222222222',
          slug: 'member-proj',
          title: 'Member Project',
          category: 'Engineering',
          status: 'Active',
          location: 'apps/hub',
          description: 'Member can edit/archive but not delete.',
          full_description: null,
          tags: [],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: '11111111-1111-4111-8111-111111111111',
        },
      ],
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Actions for Member Project' }).click();
    await expect(page.getByRole('menuitem', { name: /Edit Project/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Archive Project/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Delete Project/i })).toHaveCount(0);
  });

  test('Mobile layout (390x844) has zero horizontal overflow across Projects list and modals', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupMockHubSession(page, {
      role: 'Owner',
      initialProjects: [
        {
          id: 'proj-mob-1',
          workspace_id: '22222222-2222-4222-8222-222222222222',
          slug: 'mobile-check',
          title: 'Mobile Check Project',
          category: 'Engineering',
          status: 'Active',
          location: 'apps/hub',
          description: 'Responsive mobile layout verification.',
          full_description: null,
          tags: ['Mobile'],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: '11111111-1111-4111-8111-111111111111',
        },
      ],
    });

    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await expect(page.getByText('Mobile Check Project')).toBeVisible();

    const listOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(listOverflow).toBe(false);

    // Open Edit modal on mobile
    await page.getByRole('button', { name: 'Actions for Mobile Check Project' }).click();
    await page.getByRole('menuitem', { name: /Edit Project/i }).click();
    await expect(page.getByRole('heading', { name: /Edit Project/i })).toBeVisible();
    const modalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(modalOverflow).toBe(false);
  });
});


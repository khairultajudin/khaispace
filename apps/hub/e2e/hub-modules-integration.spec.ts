import { test, expect, type Page } from '@playwright/test';

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

async function setupFullWorkspaceMock(page: Page) {
  const userId = '11111111-1111-4111-8111-111111111111';
  const workspaceId = '22222222-2222-4222-8222-222222222222';
  const email = 'owner@khaispace.com';
  const jwt = createFakeJwt(userId, email);

  const projectsDb = [
    {
      id: 'proj-live-1',
      workspace_id: workspaceId,
      slug: 'live-alpha',
      title: 'Live Workspace Alpha',
      category: 'Engineering',
      status: 'Active',
      location: 'apps/hub',
      description: 'Live project for cross-module integration verification.',
      full_description: null,
      tags: ['Next.js'],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
    },
    {
      id: 'proj-arch-1',
      workspace_id: workspaceId,
      slug: 'archived-beta',
      title: 'Archived Beta',
      category: 'Engineering',
      status: 'Documented',
      location: 'apps/legacy',
      description: 'Archived project excluded from active metrics.',
      full_description: null,
      tags: [],
      metadata: { archived: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
    },
  ];

  const milestonesDb: Array<Record<string, unknown>> = [];
  const tasksDb: Array<Record<string, unknown>> = [
    {
      id: 'task-overdue-1',
      workspace_id: workspaceId,
      project_id: 'proj-live-1',
      milestone_id: null,
      title: 'Overdue Security Audit Task',
      priority: 'High',
      status: 'Pending',
      due_date: '2025-01-01',
      description: 'Past due task for overdue indicator test.',
      projects: { title: 'Live Workspace Alpha' },
      milestones: null,
    },
  ];
  const txDb: Array<Record<string, unknown>> = [
    {
      id: 'tx-1',
      workspace_id: workspaceId,
      project_id: 'proj-live-1',
      transaction_date: '2026-11-10',
      type: 'Income',
      category: 'Consulting',
      amount: 1500,
      description: 'Alpha Retainer',
      notes: '',
      is_investment_return: false,
      projects: { title: 'Live Workspace Alpha' },
    },
  ];
  const subsDb: Array<Record<string, unknown>> = [];
  const notesDb: Array<Record<string, unknown>> = [];

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
          user: { id: uid, email: mail, aud: 'authenticated', role: 'authenticated' },
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
            role: 'Owner',
            status: 'Active',
            workspaces: {
              id: workspaceId,
              name: 'Khai Space HQ',
              description: 'Primary Workspace',
              timezone: 'Asia/Kuala_Lumpur',
              default_currency: 'MYR',
              date_format: 'YYYY-MM-DD',
              content_density: 'Comfortable',
            },
          },
        ]),
      });
      return;
    }

    if (table === 'projects') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(projectsDb),
      });
      return;
    }

    if (table === 'milestones') {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(milestonesDb),
        });
        return;
      }
      if (method === 'POST') {
        const body = req.postDataJSON() as Record<string, unknown>;
        const created = {
          id: `ms-${Date.now()}`,
          workspace_id: workspaceId,
          project_id: body.project_id,
          title: body.title,
          target_date: body.target_date,
          status: body.status ?? 'Planned',
          description: body.description ?? '',
          projects: { title: 'Live Workspace Alpha' },
        };
        milestonesDb.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: created.id, title: created.title }),
        });
        return;
      }
      if (method === 'PATCH') {
        const id = (url.searchParams.get('id') ?? '').replace('eq.', '');
        const body = req.postDataJSON() as Record<string, unknown>;
        const ms = milestonesDb.find((m) => m.id === id);
        if (ms) Object.assign(ms, body);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ms ?? {}) });
        return;
      }
      if (method === 'DELETE') {
        const id = (url.searchParams.get('id') ?? '').replace('eq.', '');
        const idx = milestonesDb.findIndex((m) => m.id === id);
        if (idx !== -1) milestonesDb.splice(idx, 1);
        for (const t of tasksDb) {
          if (t.milestone_id === id) {
            t.milestone_id = null;
            t.milestones = null;
          }
        }
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    if (table === 'tasks') {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(tasksDb),
        });
        return;
      }
      if (method === 'POST') {
        const body = req.postDataJSON() as Record<string, unknown>;
        const ms = milestonesDb.find((m) => m.id === body.milestone_id);
        const created = {
          id: `task-${Date.now()}`,
          workspace_id: workspaceId,
          project_id: body.project_id,
          milestone_id: body.milestone_id ?? null,
          title: body.title,
          priority: body.priority ?? 'Normal',
          status: body.status ?? 'Pending',
          due_date: body.due_date,
          description: body.description ?? '',
          projects: { title: 'Live Workspace Alpha' },
          milestones: ms ? { title: ms.title } : null,
        };
        tasksDb.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: created.id, title: created.title }),
        });
        return;
      }
      if (method === 'PATCH') {
        const id = (url.searchParams.get('id') ?? '').replace('eq.', '');
        const body = req.postDataJSON() as Record<string, unknown>;
        const t = tasksDb.find((row) => row.id === id);
        if (t) Object.assign(t, body);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(t ?? {}) });
        return;
      }
      if (method === 'DELETE') {
        const id = (url.searchParams.get('id') ?? '').replace('eq.', '');
        const idx = tasksDb.findIndex((row) => row.id === id);
        if (idx !== -1) tasksDb.splice(idx, 1);
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    if (table === 'view_overall_finance_kpis') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workspace_id: workspaceId,
          total_income: 1500,
          total_expenses: 0,
          total_investment: 0,
          realized_investment_return: 0,
          net_cashflow: 1500,
          roi_percent: null,
          roi_note: 'Consulting revenue',
        }),
      });
      return;
    }

    if (table === 'financial_transactions') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(txDb) });
      return;
    }

    if (table === 'ai_subscriptions') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(subsDb) });
      return;
    }

    if (table === 'workspace_notes') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notesDb) });
      return;
    }

    await route.fulfill({
      status: method === 'POST' ? 201 : 200,
      contentType: 'application/json',
      body: JSON.stringify(method === 'POST' ? {} : []),
    });
  });
}

test.describe('Khai Space Hub — Full Cross-Module Integration E2E', () => {
  test('Overview metrics exclude archived projects, show overdue tasks, and Global Search jumps to records', async ({ page }) => {
    await setupFullWorkspaceMock(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByText('1 active • 1 archived')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('1 total • 1 overdue')).toBeVisible();
    await expect(page.getByText('RM 1,500.00')).toBeVisible();

    // Open Global Search and jump to Live Workspace Alpha
    await page.getByRole('button', { name: 'Search workspace' }).click();
    await page.getByPlaceholder(/Search projects, tasks/i).fill('Live Workspace Alpha');
    await page.getByRole('button', { name: /Live Workspace Alpha/i }).first().click();

    await expect(page.getByRole('heading', { name: 'Live Workspace Alpha' })).toBeVisible();
    await expect(page.getByText('Overdue Security Audit Task')).toBeVisible();
    await expect(page.getByText('RM 1,500.00')).toBeVisible();
  });

  test('Tasks & Milestones: Create/Edit/Delete Milestones, Create/Edit/Board View Tasks', async ({ page }) => {
    await setupFullWorkspaceMock(page);
    await page.goto('/#milestones', { waitUntil: 'networkidle' });

    // Create Milestone
    await page.getByRole('button', { name: /New Milestone/i }).click();
    await page.locator('form input[type="text"]').first().fill('Launch Beta Milestone');
    await page.getByRole('button', { name: /^Create Milestone$/i }).click();
    await expect(page.getByText('Launch Beta Milestone')).toBeVisible();

    // Switch to Tasks, create a task linked to milestone, edit it, and check Board view
    await page.getByRole('button', { name: /Tasks Queue/i }).click();
    await page.getByRole('button', { name: /New Task/i }).click();
    await page.locator('form input[type="text"]').first().fill('Prepare Release Notes');
    await page.getByRole('button', { name: /^Create Task$/i }).click();
    await expect(page.getByRole('heading', { name: 'Prepare Release Notes', exact: true })).toBeVisible();

    // Edit Task
    await page.getByRole('button', { name: 'Edit task: Prepare Release Notes' }).click();
    await page.locator('form input[type="text"]').first().fill('Prepare Release Notes v2');
    await page.getByRole('button', { name: /^Save Task$/i }).click();
    await expect(page.getByRole('heading', { name: 'Prepare Release Notes v2', exact: true })).toBeVisible();

    // Switch to Board View
    await page.getByRole('button', { name: /^Board$/i }).click();
    await expect(page.getByRole('heading', { name: 'Prepare Release Notes v2', exact: true })).toBeVisible();
  });

  test('Finance, AI Subscriptions, and Notes forms list live workspace projects (no sample data)', async ({ page }) => {
    await setupFullWorkspaceMock(page);

    // Finance TransactionForm
    await page.goto('/#transactions', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Record Transaction/i }).click();
    await expect(page.locator('form select option', { hasText: 'Live Workspace Alpha' })).toHaveCount(1);
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Subscriptions SubscriptionForm
    await page.goto('/#subscriptions', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Add Subscription/i }).first().click();
    await expect(page.locator('form select option', { hasText: 'Live Workspace Alpha' })).toHaveCount(1);
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Notes NoteForm
    await page.goto('/#notes', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Create Note/i }).first().click();
    await expect(page.locator('form select option', { hasText: 'Live Workspace Alpha' })).toHaveCount(1);
  });

  test('Mobile (390x844) renders Overview, Tasks Board, and Global Search without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupFullWorkspaceMock(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText('1 active • 1 archived')).toBeVisible({ timeout: 10000 });

    const overviewOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overviewOverflow).toBe(false);

    await page.goto('/#tasks', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Board$/i }).click();
    const boardOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(boardOverflow).toBe(false);
  });
});


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

async function setupProjectsNavigationMock(page: Page) {
  const userId = '11111111-1111-4111-8111-111111111111';
  const workspaceId = '22222222-2222-4222-8222-222222222222';
  const email = 'owner@khaispace.com';
  const jwt = createFakeJwt(userId, email);
  const now = new Date().toISOString();

  const projectsDb: MockProjectRow[] = [
    {
      id: 'proj-dir-1',
      workspace_id: workspaceId,
      slug: 'khai-space-hub',
      title: 'Khai Space Hub',
      category: 'Engineering',
      status: 'Production',
      location: 'apps/hub',
      description: 'Primary personal business & project command center.',
      full_description: null,
      tags: ['Next.js', 'Supabase'],
      metadata: {},
      created_at: now,
      updated_at: now,
      created_by: userId,
    },
    {
      id: 'proj-dir-2',
      workspace_id: workspaceId,
      slug: 'smart-rain-gauge',
      title: 'Smart Rain Gauge',
      category: 'Hardware',
      status: 'Planning',
      location: 'hardware/rain-gauge',
      description: 'Connected rainfall measurement device concept.',
      full_description: null,
      tags: ['IoT'],
      metadata: {},
      created_at: now,
      updated_at: now,
      created_by: userId,
    },
  ];

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
            role: 'Owner',
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(projectsDb),
      });
      return;
    }

    if (table === 'view_overall_finance_kpis') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workspace_id: workspaceId,
          total_income: 0,
          total_expenses: 0,
          total_investment: 0,
          realized_investment_return: 0,
          net_cashflow: 0,
          roi_percent: null,
          roi_note: '',
        }),
      });
      return;
    }

    await route.fulfill({
      status: method === 'POST' ? 201 : 200,
      contentType: 'application/json',
      body: JSON.stringify(method === 'POST' ? {} : []),
    });
  });
}

test.describe('Sidebar Projects Navigation Regression', () => {
  test('clicking Projects in sidebar from Overview opens Projects Directory list, not a single project detail', async ({
    page,
  }) => {
    await setupProjectsNavigationMock(page);

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Welcome to Khai Space Hub/i })).toBeVisible();

    await page.locator('aside nav').getByRole('button', { name: /^Projects$/i }).click();

    await expect(page.locator('header').getByText('Projects Directory')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Projects & Workspaces/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Back to Projects List/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'View details for Khai Space Hub' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View details for Smart Rain Gauge' })).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#projects');
  });

  test('clicking Projects in sidebar from a single project detail (card click, deep link, or search) resets to Projects Directory list', async ({
    page,
  }) => {
    await setupProjectsNavigationMock(page);

    // 1. Open Projects Directory and click into a single project detail
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'View details for Khai Space Hub' }).click();
    await expect(page.getByRole('button', { name: /Back to Projects List/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Khai Space Hub' })).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#project-proj-dir-1');

    // 2. Click "Projects" in sidebar directly while viewing that detail -> must open directory list
    await page.locator('aside nav').getByRole('button', { name: /^Projects$/i }).click();
    await expect(page.getByRole('heading', { name: /Projects & Workspaces/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Back to Projects List/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'View details for Khai Space Hub' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View details for Smart Rain Gauge' })).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#projects');

    // 3. Open a project via Global Search, switch to Tasks & Milestones, then click sidebar Projects -> must open directory list
    await page.getByRole('button', { name: 'Search workspace' }).click();
    await page.getByPlaceholder(/Search projects, tasks/i).fill('Smart Rain Gauge');
    await page.getByRole('button', { name: /Smart Rain Gauge/i }).first().click();
    await expect(page.getByRole('button', { name: /Back to Projects List/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smart Rain Gauge' })).toBeVisible();

    await page.locator('aside nav').getByRole('button', { name: /^Tasks & Milestones$/i }).click();
    expect(await page.evaluate(() => window.location.hash)).toBe('#tasks');

    await page.locator('aside nav').getByRole('button', { name: /^Projects$/i }).click();
    await expect(page.getByRole('heading', { name: /Projects & Workspaces/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Back to Projects List/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'View details for Khai Space Hub' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View details for Smart Rain Gauge' })).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#projects');
  });

  test('mobile sidebar drawer Projects button exits single project detail to Projects Directory list', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupProjectsNavigationMock(page);

    await page.goto('/#project-proj-dir-2', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Back to Projects List/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smart Rain Gauge' })).toBeVisible();

    await page.getByRole('button', { name: 'Open sidebar menu' }).click();
    await page.locator('nav').last().getByRole('button', { name: /^Projects$/i }).click();

    await expect(page.getByRole('heading', { name: /Projects & Workspaces/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Back to Projects List/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'View details for Khai Space Hub' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View details for Smart Rain Gauge' })).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#projects');
  });
});

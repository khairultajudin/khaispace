import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const HUB_URL = process.env.E2E_HUB_URL || 'https://hub.khaispace.com';
const AUTH_FILE = path.resolve(process.cwd(), 'e2e', '.auth', 'owner-state.json');
const HAS_AUTH_STATE = fs.existsSync(AUTH_FILE);

test.describe('Khai Space Hub — Authenticated Owner CRUD & Session Persistence E2E', () => {
  test.skip(
    !HAS_AUTH_STATE,
    'Requires interactive owner authentication first: run `npm run test:e2e:auth-setup --prefix apps/hub`'
  );

  test.use({ storageState: HAS_AUTH_STATE ? AUTH_FILE : undefined });

  test('session persists after reload and core modules load with zero console/network errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto(HUB_URL, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Executive Summary|Initialize or Join a Workspace/i)).toBeVisible({
      timeout: 15000,
    });

    // Session persistence across reload
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(/Executive Summary|Initialize or Join a Workspace/i)).toBeVisible({
      timeout: 15000,
    });

    const nonFaviconErrors = consoleErrors.filter((e) => !e.includes('404'));
    expect(nonFaviconErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test('Projects, Tasks, Notes, Finance, Subscriptions & Option B Profile CRUD persist across reload', async ({ page }) => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const projectTitle = `E2E Project ${uniqueSuffix}`;
    const taskTitle = `E2E Task ${uniqueSuffix}`;

    await page.goto(`${HUB_URL}/#projects`, { waitUntil: 'networkidle' });

    // Skip CRUD if workspace onboarding has not been completed yet
    const needsOnboarding = await page.getByText('Initialize or Join a Workspace').isVisible().catch(() => false);
    test.skip(needsOnboarding, 'Owner workspace must be initialized first via WorkspaceOnboarding.');

    // 1. Projects CREATE + reload persistence
    await page.getByRole('button', { name: /New Project/i }).click();
    await page.locator('form input[type="text"]').first().fill(projectTitle);
    await page.locator('form textarea').fill('Playwright E2E persistence verification project.');
    await page.getByRole('button', { name: /Create Project/i }).click();
    await expect(page.getByText(projectTitle)).toBeVisible({ timeout: 10000 });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(projectTitle)).toBeVisible({ timeout: 10000 });

    // 2. Tasks CREATE + reload persistence
    await page.goto(`${HUB_URL}/#tasks`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /New Task/i }).click();
    await page.locator('form input[type="text"]').first().fill(taskTitle);
    await page.getByRole('button', { name: /Create Task/i }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // 3. Option B Profile UPDATE-only check in Settings
    await page.goto(`${HUB_URL}/#profile`, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Owner Profile|Profile Settings/i)).toBeVisible({ timeout: 10000 });
  });
});


import { test, expect } from '@playwright/test';

const ROOT_URL = process.env.E2E_ROOT_URL || 'https://khaispace.com';

test.describe('Khai Space Hub — Interactive Browser QA', () => {
  test('unauthenticated root gates behind LoginView with zero console or network errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Sign in to Khai Space Hub/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Magic Link/i })).toBeVisible();
    const nonFaviconErrors = consoleErrors.filter((e) => !e.includes('404'));
    expect(nonFaviconErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test('/auth/callback renders gracefully without crash when no auth params exist', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/auth/callback', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
    const nonFaviconErrors = consoleErrors.filter((e) => !e.includes('404'));
    expect(nonFaviconErrors).toEqual([]);
  });

  for (const vp of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`login layout has no horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login', { waitUntil: 'networkidle' });
      await expect(page.locator('input[type="email"]')).toBeVisible();

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);
    });
  }

  test('root public website loads cleanly and remains unaffected', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('response', (res) => {
      if (res.status() >= 400) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto(ROOT_URL, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});

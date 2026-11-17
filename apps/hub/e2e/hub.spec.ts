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
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Login$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Forgot Password\?/i })).toBeVisible();

    // Password visibility toggle
    const toggleBtn = page.getByRole('button', { name: /Show password/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await page.getByRole('button', { name: /Hide password/i }).click();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Validation when submitting empty password
    await page.locator('input[type="email"]').fill('owner@khaispace.com');
    await page.getByRole('button', { name: /^Login$/i }).click();
    await expect(page.getByText(/Password is required\./i)).toBeVisible();

    // Forgot Password mode toggle
    await page.getByRole('button', { name: /Forgot Password\?/i }).click();
    await expect(page.getByRole('heading', { name: /Reset your password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Password Reset Link/i })).toBeVisible();
    await page.getByRole('button', { name: /Back to Sign In/i }).click();
    await expect(page.getByRole('heading', { name: /Sign in to Khai Space Hub/i })).toBeVisible();

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

  test('/reset-password renders recovery gate without crash when unauthenticated', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/reset-password', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Recovery Session Required/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Return to Sign In/i })).toBeVisible();
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

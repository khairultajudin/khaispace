import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_URL = process.env.E2E_HUB_URL || 'https://hub.khaispace.com';
const AUTH_DIR = path.resolve(process.cwd(), 'e2e', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'owner-state.json');

async function main() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  console.log(`\nLaunching Chrome for interactive owner authentication at: ${TARGET_URL}`);
  console.log('Complete Cloudflare Access and Supabase Magic Link / Email OTP in the browser window.');
  console.log('Waiting up to 5 minutes for authenticated Hub dashboard or Workspace Onboarding...\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  // Wait until either the authenticated Dashboard shell (nav/sidebar) or WorkspaceOnboarding renders
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || '';
      return (
        text.includes('Executive Summary') ||
        text.includes('Initialize or Join a Workspace') ||
        text.includes('Sign Out')
      );
    },
    { timeout: 300000 }
  );

  await context.storageState({ path: AUTH_FILE });
  console.log(`\n[OK] Authenticated storageState saved to: ${AUTH_FILE}`);
  console.log('You can now run: npm run test:e2e:authenticated --prefix apps/hub\n');

  await browser.close();
}

main().catch((err) => {
  console.error('Auth setup failed:', err);
  process.exit(1);
});


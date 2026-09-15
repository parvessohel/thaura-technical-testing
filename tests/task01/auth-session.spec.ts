import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const { loginViaOtp } = require('../../scripts/thaura-login');

const authStatePath = 'playwright/.auth/user.json';
const authMeUrl = 'https://backend.thaura.ai/api/auth/me';

async function getAuthMe(context: import('@playwright/test').BrowserContext) {
  const response = await context.request.get(authMeUrl, { failOnStatusCode: false });
  return {
    status: response.status(),
    body: await response.text()
  };
}

test.describe('Task 01 authentication and session handling', () => {
  test('Free-tier test account is authenticated and session survives navigation', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const initialAuth = await getAuthMe(context);
    expect(initialAuth.status).toBe(200);
    expect(initialAuth.body).toMatch(/shoheltqtec@gmail\.com|Thaura Test/i);

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('$12/month')).toBeVisible();

    const afterNavigation = await getAuthMe(context);
    expect(afterNavigation.status).toBe(200);
    expect(afterNavigation.body).toMatch(/Free Plan/);

    console.log(JSON.stringify({
      testAccount: 'shoheltqtec@gmail.com',
      plan: 'Free Plan',
      initialAuth,
      afterNavigation
    }, null, 2));

    await context.close();
  });

  test('Concurrent authenticated contexts remain independently usable', async ({ browser }) => {
    const firstContext = await browser.newContext({ storageState: authStatePath });
    const secondContext = await browser.newContext({ storageState: authStatePath });

    const [firstAuth, secondAuth] = await Promise.all([
      getAuthMe(firstContext),
      getAuthMe(secondContext)
    ]);

    expect(firstAuth.status).toBe(200);
    expect(secondAuth.status).toBe(200);
    expect(firstAuth.body).toMatch(/shoheltqtec@gmail\.com|Thaura Test/i);
    expect(secondAuth.body).toMatch(/shoheltqtec@gmail\.com|Thaura Test/i);

    await firstContext.clearCookies();
    const firstAfterClear = await getAuthMe(firstContext);
    const secondAfterFirstClear = await getAuthMe(secondContext);

    expect(firstAfterClear.status).toBe(401);
    expect(secondAfterFirstClear.status).toBe(200);

    console.log(JSON.stringify({
      firstContextAfterClear: firstAfterClear,
      secondContextAfterFirstClear: secondAfterFirstClear
    }, null, 2));

    await firstContext.close();
    await secondContext.close();
  });

  test('Removing the session cookie invalidates access to protected auth state', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath });
    const beforeRemoval = await getAuthMe(context);
    expect(beforeRemoval.status).toBe(200);

    await context.clearCookies();
    const afterRemoval = await getAuthMe(context);
    expect(afterRemoval.status).toBe(401);
    expect(afterRemoval.body).toMatch(/not authenticated/i);

    await context.close();
  });

  test('UI logout invalidates the authenticated session', async ({ browser }) => {
    test.setTimeout(180_000);
    const temporaryStatePath = path.resolve('playwright/.auth/task01-logout.json');

    await loginViaOtp({ saveStatePath: temporaryStatePath });
    const context = await browser.newContext({ storageState: temporaryStatePath });
    const page = await context.newPage();

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5_000);
      await page.getByRole('button', { name: /Thaura Test/ }).click({ force: true });
      await page.getByText('Logout', { exact: true }).click({ force: true });
      await page.waitForTimeout(1_000);

      const afterLogout = await getAuthMe(context);
      expect(afterLogout.status).toBe(401);
      expect(afterLogout.body).toMatch(/not authenticated/i);

      console.log(JSON.stringify({ afterLogout }, null, 2));
    } finally {
      await context.close();
      if (fs.existsSync(temporaryStatePath)) fs.unlinkSync(temporaryStatePath);
    }
  });
});

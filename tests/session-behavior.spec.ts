import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/user.json';
const authMeUrl = 'https://backend.thaura.ai/api/auth/me';

test('Authenticated session persists across navigation and loses access after cookie removal', async ({ browser }) => {
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/Thaura Test|Happy Monday/i).first()).toBeVisible();
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('$12/month')).toBeVisible();

  const authenticatedResponse = await page.request.get(authMeUrl, { failOnStatusCode: false });
  const authenticatedBody = await authenticatedResponse.text();

  await context.clearCookies();
  const unauthenticatedResponse = await page.request.get(authMeUrl, { failOnStatusCode: false });
  const unauthenticatedBody = await unauthenticatedResponse.text();

  console.log(JSON.stringify({
    authenticated: {
      status: authenticatedResponse.status(),
      body: authenticatedBody
    },
    afterCookieRemoval: {
      status: unauthenticatedResponse.status(),
      body: unauthenticatedBody
    }
  }, null, 2));

  expect(authenticatedResponse.status()).toBe(200);
  expect(unauthenticatedResponse.status()).toBe(401);
  await context.close();
});

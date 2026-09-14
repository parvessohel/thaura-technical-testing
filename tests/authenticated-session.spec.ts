import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/user.json';
const authMeUrl = 'https://backend.thaura.ai/api/auth/me';

test.describe('Authenticated session behavior', () => {
  test('Anonymous auth/me access is rejected', async ({ request }) => {
    const response = await request.get(authMeUrl, { failOnStatusCode: false });

    console.log(JSON.stringify({
      mode: 'anonymous',
      status: response.status(),
      body: await response.text()
    }, null, 2));

    expect(response.status()).toBe(401);
  });

  test('Saved authenticated state is accepted by auth/me', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();
    const responsePromise = page.waitForResponse(response => response.url() === authMeUrl);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const response = await responsePromise;
    const body = await response.text();

    console.log(JSON.stringify({
      mode: 'authenticated',
      status: response.status(),
      body
    }, null, 2));

    await expect(page.getByText(/Thaura Test|Happy Monday/i).first()).toBeVisible();
    expect(response.status()).toBe(200);
    expect(body).toMatch(/shoheltqtec@gmail\.com|Thaura Test/i);
    await context.close();
  });
});

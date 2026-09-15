import { expect, test } from '@playwright/test';

test('Key public pages render across the compatibility matrix', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
  await expect.poll(async () => (await page.locator('body').innerText()).trim().length).toBeGreaterThan(0);

  console.log(JSON.stringify({
    browser: test.info().project.name,
    viewport: page.viewportSize(),
    status: response?.status() ?? null,
    title: await page.title()
  }, null, 2));

  expect(response?.status()).toBe(200);
});

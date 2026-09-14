import { expect, test } from '@playwright/test';

test('Key public pages render across the compatibility matrix', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();

  if (test.info().project.name === 'chromium-mobile') {
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  } else {
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
  }

  console.log(JSON.stringify({
    browser: test.info().project.name,
    viewport: page.viewportSize(),
    status: response?.status() ?? null,
    title: await page.title()
  }, null, 2));

  expect(response?.status()).toBe(200);
});

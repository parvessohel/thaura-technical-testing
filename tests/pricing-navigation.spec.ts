import { expect, test } from '@playwright/test';

test('Pricing navigation from home page', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status(), 'Home page should return HTTP 200').toBe(200);

  await page.waitForTimeout(10_000);
  const pricingLink = page.getByRole('link', { name: 'Pricing' });
  await expect(pricingLink, 'Pricing link should be visible').toBeVisible();

  await Promise.all([
    page.waitForURL('**/pricing'),
    pricingLink.click()
  ]);

  const pricingResponse = await page.waitForLoadState('domcontentloaded');
  expect(page.url(), 'Pricing link should reach the Pricing page').toMatch(/\/pricing\/?$/);
  expect(pricingResponse, 'Pricing page should finish loading').toBeUndefined();
  await expect(page.locator('body'), 'Pricing page body should be visible').toBeVisible();
});
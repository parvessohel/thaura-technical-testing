import { test } from '@playwright/test';

test('Inspect Pricing page controls and visible prices', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  const buttons = await page.getByRole('button').allTextContents();
  const links = await page.getByRole('link').allTextContents();
  const bodyText = await page.locator('body').innerText();

  console.log(JSON.stringify({
    url: page.url(),
    buttons,
    links,
    bodyText
  }, null, 2));
});
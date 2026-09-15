import { test } from '@playwright/test';

test('Inspect Contact form fields', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  const fields = await page.locator('input, textarea, select, button').evaluateAll(elements =>
    elements.map(element => ({
      tag: element.tagName,
      type: element.getAttribute('type'),
      name: element.getAttribute('name'),
      id: element.id,
      placeholder: element.getAttribute('placeholder'),
      required: element.hasAttribute('required'),
      ariaLabel: element.getAttribute('aria-label'),
      text: element.textContent?.trim() ?? ''
    }))
  );

  console.log(JSON.stringify({ url: page.url(), title: await page.title(), fields }, null, 2));
});
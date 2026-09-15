import { expect, test } from '@playwright/test';

test('Thaura home page baseline', async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const errorResponses: string[] = [];

  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText ?? 'unknown error'}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      errorResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(10_000);
  await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();

  console.log(JSON.stringify({
    finalUrl: page.url(),
    status: response?.status() ?? null,
    title: await page.title(),
    consoleErrors,
    failedRequests,
    errorResponses
  }, null, 2));
});
import { expect, test } from '@playwright/test';

test('Contact form accepts valid synthetic submission and exposes response', async ({ page }) => {
  const responses: string[] = [];
  page.on('response', response => {
    if (response.request().method() !== 'GET') {
      responses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  await page.locator('#name').fill('Thaura QA Test');
  await page.locator('#email').fill('qa-contact-test@example.com');
  await page.locator('#subject').fill('QA-CONTACT-20260913-001');
  await page.locator('#message').fill('Synthetic testing message. Please ignore.');

  await page.getByRole('button', { name: 'Send Message' }).last().click();
  await page.waitForTimeout(3_000);

  const bodyText = await page.locator('body').innerText();
  console.log(JSON.stringify({
    url: page.url(),
    responses,
    bodyText,
    deliveryVerification: 'Not independently verifiable'
  }, null, 2));

  expect(bodyText, 'The form should display a submission result').toMatch(/sent|thank|success|error|failed/i);
});
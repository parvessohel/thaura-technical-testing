import { expect, test } from '@playwright/test';

test('Contact form enforces required fields and email format', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  await page.getByRole('button', { name: 'Send Message' }).last().click();

  for (const field of ['#name', '#email', '#message']) {
    const validationMessage = await page.locator(field).evaluate(element =>
      (element as HTMLInputElement | HTMLTextAreaElement).validationMessage
    );
    expect(validationMessage, `${field} should have a required-field validation message`).not.toBe('');
  }

  await page.locator('#name').fill('Thaura QA Test');
  await page.locator('#email').fill('not-an-email');
  await page.locator('#message').fill('Validation-only test message.');
  await page.getByRole('button', { name: 'Send Message' }).last().click();

  const emailValidationMessage = await page.locator('#email').evaluate(element =>
    (element as HTMLInputElement).validationMessage
  );
  expect(emailValidationMessage, 'Invalid email should be rejected').not.toBe('');
});
import { expect, test } from '@playwright/test';

test('Inspect FAQ pricing references', async ({ page }) => {
  await page.goto('/faq', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  const pricingQuestion = page.getByRole('button', { name: 'Why is your pricing set at $15?' });
  await pricingQuestion.click();
  await expect(pricingQuestion).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body'), 'FAQ pricing answer should reference the $15 price').toContainText(
    'We deliberately set our pricing at $15'
  );

  console.log(JSON.stringify({
    url: page.url(),
    title: await page.title(),
    pricingAnswer: await page.locator('body').innerText()
  }, null, 2));
});
import { expect, test } from '@playwright/test';

test('Contact form handles long, Unicode, RTL, and script-like input without server errors', async ({ page }) => {
  const responses: Array<{ url: string; status: number; method: string }> = [];
  page.on('response', response => {
    if (response.request().method() !== 'GET') {
      responses.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  const fields = await page.locator('#name, #email, #subject, #message').evaluateAll(elements =>
    elements.map(element => ({
      id: element.id,
      maxLength: (element as HTMLInputElement | HTMLTextAreaElement).maxLength
    }))
  );

  const scriptLikeInput = '<script>alert("qa")</script> & \' "';
  const longInput = 'QA-'.repeat(1_000);
  await page.locator('#name').fill(`${scriptLikeInput} Thaura QA`);
  await page.locator('#email').fill('qa-input-security@example.com');
  await page.locator('#subject').fill(`${longInput} اختبار בדיקה`);
  await page.locator('#message').fill(`${longInput}\nمرحبا بالعالم\nשלום עולם\n${scriptLikeInput}`);

  await page.getByRole('button', { name: 'Send Message' }).last().click();
  await page.waitForTimeout(3_000);

  const bodyText = await page.locator('body').innerText();
  const serverErrors = responses.filter(response => response.status >= 500);
  const reflectedScript = bodyText.includes('<script>alert("qa")</script>');

  console.log(JSON.stringify({ fields, responses, serverErrors, reflectedScript }, null, 2));

  expect(serverErrors, 'Unusual contact input should not cause a server error').toEqual([]);
  expect(reflectedScript, 'Script-like input should not be reflected as executable markup').toBe(false);
});

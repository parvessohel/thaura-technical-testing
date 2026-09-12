import { expect, test } from '@playwright/test';

test('Pricing Annual toggle updates Pro billing text', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  const pageText = page.locator('body');
  await expect(pageText, 'Monthly Pro price should be visible').toContainText('$12/month');
  await expect(pageText, 'Annual saving label should be visible').toContainText('Save 20%');
  await expect(pageText, 'Annual pricing text should be rendered').toContainText('Annual');

  const annualOption = page.getByText('Annual', { exact: false }).first();
  await expect(annualOption, 'Annual pricing option should be visible').toBeVisible();
  console.log('Annual before:', await annualOption.evaluate(element => ({
    tag: element.tagName,
    role: element.getAttribute('role'),
    ariaSelected: element.getAttribute('aria-selected'),
    ariaPressed: element.getAttribute('aria-pressed'),
    className: element.className,
    outerHTML: element.outerHTML
  })));
  await annualOption.click();

  await expect(pageText, 'Annual billing text should be visible').toContainText('Billed $144/year');
  console.log('Annual after:', await annualOption.evaluate(element => ({
    role: element.getAttribute('role'),
    ariaSelected: element.getAttribute('aria-selected'),
    ariaPressed: element.getAttribute('aria-pressed'),
    className: element.className,
    outerHTML: element.outerHTML
  })));
  console.log('Annual pricing text:', await pageText.innerText());
  
  const monthlyOption = page.getByText('Monthly', { exact: true }).first();
  await expect(monthlyOption, 'Monthly pricing option should be visible').toBeVisible();
  await monthlyOption.click();
  
  console.log('Monthly after:', await monthlyOption.evaluate(element => ({
    role: element.getAttribute('role'),
    ariaSelected: element.getAttribute('aria-selected'),
    className: element.className,
    outerHTML: element.outerHTML
  })));
  await expect(pageText, 'Monthly Pro price should be $15/month').toContainText('$15/month');
  expect(15 * 12, 'Monthly annual equivalent should be $180').toBe(180);
  expect(180 * 0.8, 'Annual price should reflect a 20% saving').toBe(144);
  console.log('Monthly pricing text:', await pageText.innerText());
});
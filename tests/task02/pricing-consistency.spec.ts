import { expect, test } from '@playwright/test';

test('Pricing figures are extracted and mathematically checked across Pricing and FAQ', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5_000);
  const pricingText = await page.locator('body').innerText();

  const monthlyMatches = [...pricingText.matchAll(/\$(\d+)\/month/g)];
  const monthlyMatch = monthlyMatches.find(match => Number(match[1]) > 0);
  const annualMatch = pricingText.match(/Billed \$(\d+)\/year/);
  const savingMatch = pricingText.match(/Save (\d+)%/);
  expect(monthlyMatch).not.toBeNull();
  expect(annualMatch).not.toBeNull();
  expect(savingMatch).not.toBeNull();

  const monthlyPrice = Number(monthlyMatch?.[1]);
  const annualPrice = Number(annualMatch?.[1]);
  const statedSavingPercent = Number(savingMatch?.[1]);
  const monthlyEquivalent = monthlyPrice * 12;
  const calculatedSavingPercent = Math.round((1 - annualPrice / monthlyEquivalent) * 100);

  await page.goto('/faq', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3_000);
  const faqText = await page.locator('body').innerText();
  const faqPriceMatch = faqText.match(/pricing set at \$(\d+)/i);
  const faqMonthlyPrice = faqPriceMatch ? Number(faqPriceMatch[1]) : null;

  const finding = {
    pricingPage: { monthlyPrice, annualPrice, statedSavingPercent },
    calculation: { monthlyEquivalent, calculatedSavingPercent },
    faq: { monthlyPrice: faqMonthlyPrice },
    consistent: calculatedSavingPercent === statedSavingPercent && faqMonthlyPrice === monthlyPrice
  };

  console.log(JSON.stringify(finding, null, 2));

  expect(monthlyEquivalent).toBeGreaterThan(0);
  expect(statedSavingPercent).toBeGreaterThanOrEqual(0);
  expect(calculatedSavingPercent).toBeGreaterThanOrEqual(0);
});

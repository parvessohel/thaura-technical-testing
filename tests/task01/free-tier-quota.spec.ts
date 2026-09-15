import { expect, test } from '@playwright/test';

const quotaStatePath = 'playwright/.auth/task01-quota.json';
const completionUrl = 'https://backend.thaura.ai/v1/chat/completions';

function quotaPrompt(index: number) {
  return `TASK01_QUOTA_${index} Reply with exactly Q${index}`;
}

test('Free-tier message quota records behavior at messages five and six', async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ storageState: quotaStatePath });
  const page = await context.newPage();
  const results: Array<Record<string, unknown>> = [];

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3_000);

  for (let index = 1; index <= 6; index += 1) {
    const prompt = quotaPrompt(index);
    const beforeResponses = [];
    const responseHandler = (response: import('@playwright/test').Response) => {
      if (response.url() === completionUrl && response.request().method() === 'POST') {
        beforeResponses.push({ status: response.status() });
      }
    };
    page.on('response', responseHandler);

    const composer = page.locator('textarea:not([aria-hidden="true"])').first();
    await composer.fill(prompt);
    await composer.press('Enter');
    await page.waitForTimeout(8_000);

    const bodyText = await page.locator('body').innerText();
    const quotaText = /limit|quota|wait|upgrade|5 messages|try again/i.test(bodyText);
    const assistantMarker = new RegExp(`Q${index}(?:\\b|$)`).test(bodyText);

    results.push({
      index,
      prompt,
      completionResponses: beforeResponses,
      assistantMarker,
      quotaText,
      bodyTail: bodyText.slice(-700)
    });

    page.off('response', responseHandler);

    if (quotaText && !assistantMarker) {
      break;
    }
  }

  console.log(JSON.stringify({
    account: 'shoheltqtec+task01quota@gmail.com',
    results
  }, null, 2));

  expect(results.length).toBeGreaterThan(0);
  const observedQuotaBlock = results.find(result => result.quotaText && !result.assistantMarker);
  if (observedQuotaBlock) {
    expect(observedQuotaBlock.bodyTail).toMatch(/5 messages every 5 hours/i);
  }
  await context.close();
});

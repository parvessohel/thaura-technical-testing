import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/task01-quotaerr.json';
const completionUrl = 'https://backend.thaura.ai/v1/chat/completions';
const quotaPattern = /out of messages|5 messages every 5 hours|upgrade to pro/i;

function prompt(index: number) {
  return `TASK01_ERRQUOTA_${index} Reply with exactly E${index}`;
}

async function sendViaComposer(page: import('@playwright/test').Page, text: string) {
  const composer = page.locator('textarea:not([aria-hidden="true"])').first();
  await composer.fill(text);
  await composer.press('Enter');
  await page.waitForTimeout(8_000);
  return page.locator('body').innerText();
}

test('A rejected/errored completion request does not consume a quota slot', async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  // Deliberately send a malformed request to the same session-authenticated
  // endpoint before consuming any legitimate messages, to see whether an
  // error response still counts against the 5-message allowance.
  const malformedResponse = await context.request.post(completionUrl, {
    failOnStatusCode: false,
    data: { model: 'thaura', messages: 'this-should-be-an-array' }
  });
  const malformedStatus = malformedResponse.status();
  const malformedBody = await malformedResponse.text();

  const results: Array<{ index: number; quotaBlocked: boolean; markerRendered: boolean }> = [];
  for (let index = 1; index <= 5; index += 1) {
    const bodyText = await sendViaComposer(page, prompt(index));
    const quotaBlocked = quotaPattern.test(bodyText);
    const markerRendered = new RegExp(`\\bE${index}\\b`).test(bodyText);
    results.push({ index, quotaBlocked, markerRendered });
    if (quotaBlocked && !markerRendered) break;
  }

  const successfulMessages = results.filter(result => result.markerRendered).length;
  const blockedAtIndex = results.find(result => result.quotaBlocked && !result.markerRendered)?.index ?? null;

  console.log(JSON.stringify({
    account: 'shoheltqtec+task01quotaerr@gmail.com',
    malformedRequest: { status: malformedStatus, bodySnippet: malformedBody.slice(0, 300) },
    results,
    successfulMessages,
    blockedAtIndex,
    interpretation: blockedAtIndex === null
      ? 'inconclusive: never observed a quota block within 5 messages'
      : (successfulMessages >= 5
        ? 'the malformed/errored request did NOT consume a quota slot (all 5 legitimate messages still succeeded)'
        : 'the malformed/errored request DID consume a quota slot (fewer than 5 legitimate messages succeeded before blocking)')
  }, null, 2));

  expect(malformedStatus).toBeGreaterThanOrEqual(400);
  expect(malformedStatus).toBeLessThan(500);
  expect(results.length).toBeGreaterThan(0);

  await context.close();
});

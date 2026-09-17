import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/task01-bypass.json';
const completionUrl = 'https://backend.thaura.ai/v1/chat/completions';
const quotaPattern = /out of messages|5 messages every 5 hours|upgrade to pro/i;

function prompt(index: number) {
  return `TASK01_BYPASS_${index} Reply with exactly B${index}`;
}

async function sendViaComposer(page: import('@playwright/test').Page, text: string) {
  const composer = page.locator('textarea:not([aria-hidden="true"])').first();
  await composer.fill(text);
  await composer.press('Enter');
  await page.waitForTimeout(8_000);
  return page.locator('body').innerText();
}

test('Free-tier quota cannot be bypassed via multi-tab, refresh, or a direct API call', async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3_000);

  let capturedPayload: unknown = null;
  page.on('request', request => {
    if (request.url() === completionUrl && request.method() === 'POST' && !capturedPayload) {
      capturedPayload = request.postDataJSON();
    }
  });

  // Consume the 5-message allowance from a single tab first.
  let blockedInTabOne = false;
  for (let index = 1; index <= 5; index += 1) {
    const bodyText = await sendViaComposer(page, prompt(index));
    if (quotaPattern.test(bodyText)) {
      blockedInTabOne = true;
      break;
    }
  }

  // Vector 1: a second tab (browser context) sharing the same authenticated account/session.
  const secondContext = await browser.newContext({ storageState: authStatePath });
  const secondPage = await secondContext.newPage();
  await secondPage.goto('/', { waitUntil: 'domcontentloaded' });
  await secondPage.waitForTimeout(3_000);
  const secondTabBody = await sendViaComposer(secondPage, prompt(6));
  const secondTabBlocked = quotaPattern.test(secondTabBody);
  const secondTabMarker = /\bB6\b/.test(secondTabBody);
  await secondContext.close();

  // Vector 2: reload/refresh the original tab's session and try again.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3_000);
  const refreshBody = await sendViaComposer(page, prompt(7));
  const refreshBlocked = quotaPattern.test(refreshBody);
  const refreshMarker = /\bB7\b/.test(refreshBody);

  // Vector 3: a direct HTTP call to the completions endpoint, reusing the same
  // authenticated cookies, replaying the exact payload shape the UI itself sent.
  let directApiStatus: number | null = null;
  let directApiBody = '';
  if (capturedPayload && typeof capturedPayload === 'object') {
    const directResponse = await context.request.post(completionUrl, {
      failOnStatusCode: false,
      data: {
        ...(capturedPayload as Record<string, unknown>),
        messages: [{ role: 'user', content: prompt(8) }]
      }
    });
    directApiStatus = directResponse.status();
    directApiBody = await directResponse.text();
  }

  console.log(JSON.stringify({
    account: 'shoheltqtec+task01bypass@gmail.com',
    blockedInTabOneWithinFive: blockedInTabOne,
    secondTab: { blocked: secondTabBlocked, assistantMarkerRendered: secondTabMarker },
    sessionRefresh: { blocked: refreshBlocked, assistantMarkerRendered: refreshMarker },
    directApiCall: { attempted: capturedPayload !== null, status: directApiStatus, bodySnippet: directApiBody.slice(0, 400) }
  }, null, 2));

  // The account-wide limit must hold regardless of which tab issues the request.
  expect(secondTabBlocked || !secondTabMarker).toBe(true);
  // Refreshing the page/session must not reset or clear the quota block.
  expect(refreshBlocked || !refreshMarker).toBe(true);
  // A direct API call replaying the UI's own payload must not succeed once blocked.
  if (directApiStatus !== null) {
    expect(directApiStatus).not.toBe(200);
  }

  await context.close();
});

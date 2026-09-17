import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/task01-window.json';
const completionUrl = 'https://backend.thaura.ai/v1/chat/completions';

function prompt(index: number) {
  return `TASK01_WINDOW_${index} Reply with exactly W${index}`;
}

async function sendViaComposer(page: import('@playwright/test').Page, text: string) {
  const composer = page.locator('textarea:not([aria-hidden="true"])').first();
  await composer.fill(text);
  await composer.press('Enter');
  await page.waitForTimeout(8_000);
  return page.locator('body').innerText();
}

test('Free-tier quota reset window is anchored to the oldest or newest message', async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  let capturedPayload: unknown = null;
  page.on('request', request => {
    if (request.url() === completionUrl && request.method() === 'POST' && !capturedPayload) {
      capturedPayload = request.postDataJSON();
    }
  });

  const messageTimestamps: string[] = [];
  const quotaPattern = /out of messages|5 messages every 5 hours|upgrade to pro/i;
  let blockedEarly = false;

  for (let index = 1; index <= 5; index += 1) {
    messageTimestamps.push(new Date().toISOString());
    const bodyText = await sendViaComposer(page, prompt(index));
    if (quotaPattern.test(bodyText)) {
      blockedEarly = true;
      break;
    }
  }

  let resetAt: string | null = null;
  let directApiStatus: number | null = null;
  if (!blockedEarly && capturedPayload && typeof capturedPayload === 'object') {
    const blockedResponse = await context.request.post(completionUrl, {
      failOnStatusCode: false,
      data: {
        ...(capturedPayload as Record<string, unknown>),
        messages: [{ role: 'user', content: prompt(6) }]
      }
    });
    directApiStatus = blockedResponse.status();
    const body = await blockedResponse.json().catch(() => null);
    resetAt = body?.error?.resetAt ?? null;
  }

  const firstMessageTime = messageTimestamps[0] ? new Date(messageTimestamps[0]) : null;
  const lastMessageTime = messageTimestamps[messageTimestamps.length - 1]
    ? new Date(messageTimestamps[messageTimestamps.length - 1])
    : null;
  const resetTime = resetAt ? new Date(resetAt) : null;

  const fiveHoursMs = 5 * 60 * 60 * 1000;
  const diffFromFirstPlusFiveHoursMs = resetTime && firstMessageTime
    ? Math.abs(resetTime.getTime() - (firstMessageTime.getTime() + fiveHoursMs))
    : null;
  const diffFromLastPlusFiveHoursMs = resetTime && lastMessageTime
    ? Math.abs(resetTime.getTime() - (lastMessageTime.getTime() + fiveHoursMs))
    : null;

  console.log(JSON.stringify({
    account: 'shoheltqtec+task01window@gmail.com',
    blockedEarly,
    messageTimestamps,
    directApiStatus,
    resetAt,
    diffFromFirstPlusFiveHoursMs,
    diffFromLastPlusFiveHoursMs,
    interpretation: diffFromFirstPlusFiveHoursMs === null
      ? 'inconclusive: no resetAt captured'
      : (diffFromFirstPlusFiveHoursMs < diffFromLastPlusFiveHoursMs!
        ? 'anchored to first (oldest) message in the window'
        : 'anchored to last (most recent) message in the window')
  }, null, 2));

  test.skip(blockedEarly, 'Account was already quota-blocked before all 5 messages could be sent.');
  test.skip(resetAt === null, 'No resetAt timestamp was returned by the direct API call.');
  expect(resetTime).not.toBeNull();

  await context.close();
});

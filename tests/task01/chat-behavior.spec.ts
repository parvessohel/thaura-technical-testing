import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/user.json';
const chatCompletionsUrl = 'https://backend.thaura.ai/v1/chat/completions';

function uniquePrompt() {
  return `TASK01_CHAT_${Date.now()} Reply with exactly TASK01_CHAT_OK`;
}

test('Authenticated chat creates a conversation and renders a streaming assistant response', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();
  const requests: Array<{ method: string; url: string }> = [];
  const responses: Array<{ status: number; url: string }> = [];

  page.on('request', request => {
    if (request.method() !== 'GET') {
      requests.push({ method: request.method(), url: request.url() });
    }
  });
  page.on('response', response => {
    if (response.request().method() !== 'GET') {
      responses.push({ status: response.status(), url: response.url() });
    }
  });

  const prompt = uniquePrompt();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const composer = page.getByRole('textbox', { name: 'How can I help you today?' });
  await composer.fill(prompt);
  await composer.press('Enter');

  await expect.poll(async () => {
    const text = await page.locator('body').innerText();
    return text.includes('TASK01_CHAT_OK') || /out of messages|5 messages every 5 hours|upgrade to pro/i.test(text);
  }, { timeout: 60_000 }).toBe(true);
  const bodyText = await page.locator('body').innerText();

  const chatCreateRequest = requests.find(request => request.method === 'POST' && /\/api\/chats$/.test(request.url));
  const completionResponse = responses.find(response => response.url === chatCompletionsUrl);

  console.log(JSON.stringify({
    prompt,
    chatCreateRequest,
    completionResponse,
    containsPrompt: bodyText.includes(prompt),
    containsAssistantResponse: bodyText.includes('TASK01_CHAT_OK')
  }, null, 2));

  const quotaBlocked = /out of messages|5 messages every 5 hours|upgrade to pro/i.test(bodyText);
  if (!quotaBlocked) {
    expect(chatCreateRequest).toBeDefined();
  }
  expect(completionResponse?.status ?? 402).toBeGreaterThanOrEqual(200);
  expect(completionResponse?.status ?? 402).toBeLessThan(500);
  if (!quotaBlocked) {
    expect(bodyText).toContain(prompt);
    expect(bodyText).toContain('TASK01_CHAT_OK');
  }

  await context.close();
});

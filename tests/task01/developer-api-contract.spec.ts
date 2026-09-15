import { expect, test } from '@playwright/test';

const apiBaseUrl = 'https://backend.thaura.ai';
const completionsUrl = `${apiBaseUrl}/v1/chat/completions`;

async function postWithoutAuth(body: unknown, authorization?: string) {
  return fetch(completionsUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authorization ? { authorization } : {})
    },
    body: JSON.stringify(body)
  });
}

test('Developer API rejects unauthenticated and malformed contract requests safely', async ({ request }) => {
  const missingAuth = await request.post(completionsUrl, {
    failOnStatusCode: false,
    data: { messages: [{ role: 'user', content: 'TASK01_API_NO_AUTH' }] }
  });
  const malformedAuth = await request.post(completionsUrl, {
    failOnStatusCode: false,
    headers: { authorization: 'Bearer invalid-task01-key' },
    data: { messages: [{ role: 'user', content: 'TASK01_API_INVALID_AUTH' }] }
  });
  const missingMessages = await request.post(completionsUrl, {
    failOnStatusCode: false,
    headers: { authorization: 'Bearer invalid-task01-key' },
    data: {}
  });

  const results = [
    { name: 'missingAuth', status: missingAuth.status(), body: await missingAuth.text() },
    { name: 'malformedAuth', status: malformedAuth.status(), body: await malformedAuth.text() },
    { name: 'missingMessages', status: missingMessages.status(), body: await missingMessages.text() }
  ];

  console.log(JSON.stringify(results, null, 2));

  expect(results[0].status).toBe(401);
  expect([400, 401]).toContain(results[1].status);
  expect([400, 401]).toContain(results[2].status);
  expect(results.every(result => result.status < 500)).toBe(true);
});

test('API documentation exposes the required Task 01 contract claims', async ({ page }) => {
  await page.goto('/api-platform', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3_000);
  const text = await page.locator('body').innerText();

  const claims = {
    endpoint: /POST\s*\/v1\/chat\/completions/i.test(text),
    auth: /Authorization: Bearer YOUR_API_KEY/i.test(text),
    temperatureRange: /0\.0-2\.0/i.test(text),
    maxTokenCap: /Capped at 32000/i.test(text),
    precedence: /max_completion_tokens wins|takes precedence over max_tokens/i.test(text),
    ignoredParameters: /accepted but ignored|top_p.*frequency_penalty.*presence_penalty.*logit_bias.*n.*user/is.test(text),
    rejectedParameters: /functions and function_call.*not supported|parameters that are rejected/is.test(text),
    rateLimits: /60 requests per minute.*8 concurrent requests/is.test(text),
    nonStreamingSchema: /chat\.completion|prompt_tokens|completion_tokens|total_tokens/i.test(text),
    streamingSchema: /chat\.completion\.chunk|data: \[DONE\]/i.test(text),
    statusCodes: /401.*Missing or invalid API key.*402.*Insufficient balance.*429.*Rate limit exceeded/is.test(text)
  };

  console.log(JSON.stringify({ claims }, null, 2));
  expect(Object.values(claims).every(Boolean)).toBe(true);
});

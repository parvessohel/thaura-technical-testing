import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/user.json';
const backendOrigin = 'https://backend.thaura.ai';
const publicRoutes = ['/', '/pricing', '/api-platform', '/faq'];

function isReadOnlyApiRequest(request: { method(): string; url(): string }) {
  return request.method() === 'GET' && request.url().startsWith(`${backendOrigin}/api/`);
}

test('Discovered read-only API endpoints enforce anonymous versus authenticated access', async ({ browser }) => {
  test.setTimeout(120_000);
  const authenticatedContext = await browser.newContext({ storageState: authStatePath });
  const page = await authenticatedContext.newPage();
  const discovered = new Set<string>();

  page.on('request', request => {
    if (isReadOnlyApiRequest(request)) discovered.add(request.url());
  });

  for (const route of publicRoutes) {
    await page.goto(route, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(1_000);
  }

  const endpoints = [...discovered];
  const results = [];
  for (const endpoint of endpoints) {
    const authenticatedResponse = await page.request.get(endpoint, { failOnStatusCode: false });
    const authenticatedBody = await authenticatedResponse.text();
    const anonymousContext = await browser.newContext();
    const anonymousResponse = await anonymousContext.request.get(endpoint, { failOnStatusCode: false });
    const anonymousBody = await anonymousResponse.text();
    await anonymousContext.close();

    results.push({
      endpoint,
      authenticatedStatus: authenticatedResponse.status(),
      anonymousStatus: anonymousResponse.status(),
      authenticatedBodyPreview: authenticatedBody.slice(0, 300),
      anonymousBodyPreview: anonymousBody.slice(0, 300)
    });
  }

  console.log(JSON.stringify({ endpoints, results }, null, 2));

  expect(endpoints).toContain(`${backendOrigin}/api/auth/me`);
  expect(results.find(result => result.endpoint.endsWith('/api/auth/me'))?.authenticatedStatus).toBe(200);
  expect(results.find(result => result.endpoint.endsWith('/api/auth/me'))?.anonymousStatus).toBe(401);
  expect(results.every(result => result.authenticatedStatus < 500 && result.anonymousStatus < 500)).toBe(true);

  await authenticatedContext.close();
});

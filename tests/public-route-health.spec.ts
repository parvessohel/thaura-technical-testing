import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/home',
  '/story',
  '/constitution',
  '/api-platform',
  '/download',
  '/pricing',
  '/faq',
  '/contact',
  '/careers',
  '/community',
  '/terms-of-service',
  '/privacy-policy',
  '/imprint'
];

function isExpectedAnonymousAuthFailure(url: string, status: number) {
  return status === 401 && url.endsWith('/api/auth/me');
}

test('Public routes classify console errors and failed network requests', async ({ page }) => {
  test.setTimeout(180_000);
  const reports = [];

  for (const route of publicRoutes) {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const failedRequests: string[] = [];
    const errorResponses: Array<{ status: number; method: string; url: string; expected: boolean }> = [];

    page.removeAllListeners('console');
    page.removeAllListeners('requestfailed');
    page.removeAllListeners('response');
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
      if (message.type() === 'warning') consoleWarnings.push(message.text());
    });
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText ?? 'unknown'}`);
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        errorResponses.push({
          status: response.status(),
          method: response.request().method(),
          url: response.url(),
          expected: isExpectedAnonymousAuthFailure(response.url(), response.status())
        });
      }
    });

    const response = await page.goto(route, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(1_000);

    reports.push({
      route,
      documentStatus: response?.status() ?? null,
      consoleErrors,
      consoleWarnings,
      failedRequests,
      errorResponses,
      unexpectedErrorResponses: errorResponses.filter(error => !error.expected)
    });
  }

  console.log(JSON.stringify({ reports }, null, 2));

  expect(reports.every(report => report.documentStatus === 200), 'Every public route should return HTTP 200').toBe(true);
  expect(reports.every(report => report.unexpectedErrorResponses.length === 0), 'Public routes should have no unexpected HTTP error responses').toBe(true);
});

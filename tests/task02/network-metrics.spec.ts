import { expect, test } from '@playwright/test';

const keyPages = ['/', '/pricing', '/api-platform', '/faq'];

test('Key pages report network request count and transferred response size', async ({ page }) => {
  test.setTimeout(120_000);
  const reports = [];

  for (const route of keyPages) {
    const responses: Array<{ url: string; status: number; bytes: number }> = [];
    page.removeAllListeners('response');
    page.on('response', response => {
      const contentLength = Number(response.headers()['content-length'] || 0);
      responses.push({
        url: response.url(),
        status: response.status(),
        bytes: Number.isFinite(contentLength) ? contentLength : 0
      });
    });

    const documentResponse = await page.goto(route, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(2_000);

    const failedResponses = responses.filter(response => response.status >= 400);
    const expectedUnauthenticatedResponses = failedResponses.filter(response =>
      response.url.endsWith('/api/auth/me') && response.status === 401
    );
    const unexpectedFailures = failedResponses.filter(response => !expectedUnauthenticatedResponses.includes(response));
    reports.push({
      route,
      documentStatus: documentResponse?.status() ?? null,
      requestCount: responses.length,
      knownTransferBytes: responses.reduce((total, response) => total + response.bytes, 0),
      failedResponses,
      expectedUnauthenticatedResponses,
      unexpectedFailures
    });
  }

  console.log(JSON.stringify({ reports }, null, 2));

  expect(reports.every(report => report.documentStatus === 200), 'Key pages should return HTTP 200').toBe(true);
  expect(reports.every(report => report.unexpectedFailures.length === 0), 'Key pages should not emit unexpected HTTP 4xx/5xx responses').toBe(true);
  expect(reports.every(report => report.requestCount > 0), 'Each key page should produce network requests').toBe(true);
});

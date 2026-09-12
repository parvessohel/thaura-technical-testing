import { expect, test } from '@playwright/test';

test('Home page links resolve without HTTP or error destinations', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10_000);

  const hrefs = await page.locator('a[href]').evaluateAll(anchors =>
    [...new Set(anchors.map(anchor => (anchor as HTMLAnchorElement).href))]
  );

  const results = [];
  for (const href of hrefs) {
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      results.push({ href, status: null, finalUrl: null, skipped: true });
      continue;
    }

    const response = await request.get(href, { failOnStatusCode: false });
    results.push({ href, status: response.status(), finalUrl: response.url(), skipped: false });
  }

  const httpLinks = results.filter(result => result.href.startsWith('http://'));
  const errorLinks = results.filter(result => !result.skipped && result.status >= 400);

  console.log(JSON.stringify({ total: results.length, results, httpLinks, errorLinks }, null, 2));
  expect(httpLinks, 'HTTPS page should not contain HTTP links').toEqual([]);
  expect(errorLinks, 'Home page links should not return HTTP 4xx/5xx responses').toEqual([]);
});
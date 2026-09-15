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

test('Public-site links resolve without broken destinations or mixed-content URLs', async ({ page, request }) => {
  test.setTimeout(120_000);
  const discovered = new Set<string>();
  const missingRoutes: string[] = [];

  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 400) {
      missingRoutes.push(`${route} -> ${response?.status() ?? 'no response'}`);
      continue;
    }

    const hrefs = await page.locator('a[href]').evaluateAll(anchors =>
      anchors.map(anchor => (anchor as HTMLAnchorElement).href)
    );

    for (const href of hrefs) {
      discovered.add(href);
    }
  }

  const results: Array<{
    href: string;
    status: number | null;
    finalUrl: string | null;
    skipped: boolean;
    reason?: string;
  }> = [];

  for (const href of discovered) {
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
      results.push({ href, status: null, finalUrl: null, skipped: true, reason: 'non-http link' });
      continue;
    }

    try {
      const isBinaryDownload = /\.(dmg|exe|zip|apk)(?:\?|$)/i.test(new URL(href).pathname);
      const response = isBinaryDownload
        ? await request.head(href, { failOnStatusCode: false, timeout: 30_000 })
        : await request.get(href, { failOnStatusCode: false, timeout: 30_000 });
      results.push({
        href,
        status: response.status(),
        finalUrl: response.url(),
        skipped: false
      });
    } catch (error) {
      results.push({
        href,
        status: null,
        finalUrl: null,
        skipped: false,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const mixedContentLinks = results.filter(result => result.href.startsWith('http://'));
  const brokenLinks = results.filter(result => !result.skipped && (!result.status || result.status >= 400));
  const redirectFailures = results.filter(result =>
    !result.skipped && result.finalUrl !== null && result.status !== null && result.finalUrl !== result.href && result.status >= 400
  );

  console.log(JSON.stringify({
    routesChecked: publicRoutes,
    missingRoutes,
    discoveredLinks: results.length,
    mixedContentLinks,
    brokenLinks,
    redirectFailures
  }, null, 2));

  expect(missingRoutes, 'Known public routes should resolve').toEqual([]);
  expect(mixedContentLinks, 'HTTPS pages should not expose HTTP links').toEqual([]);
  expect(brokenLinks, 'Public-site links should not return HTTP 4xx/5xx responses or fail to resolve').toEqual([]);
  expect(redirectFailures, 'Redirect destinations should not end in an HTTP error').toEqual([]);
});

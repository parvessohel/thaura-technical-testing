import { expect, test } from '@playwright/test';

const keyPages = ['/', '/pricing', '/api-platform', '/faq'];

test('Key-page media uses valid assets and reports loading optimization signals', async ({ page }) => {
  test.setTimeout(120_000);
  const reports = [];

  for (const path of keyPages) {
    const assetSizes = new Map<string, number>();
    page.removeAllListeners('response');
    page.on('response', async response => {
      if (!/\.(?:avif|webp|png|jpe?g|gif|svg|mp4|webm)(?:\?|$)/i.test(response.url())) return;
      const contentLength = Number(response.headers()['content-length'] || 0);
      if (contentLength > 0) assetSizes.set(response.url(), contentLength);
    });

    await page.goto(path, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(1_000);

    const media = await page.locator('img, video').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      const source = element instanceof HTMLImageElement ? element.currentSrc || element.src : element.currentSrc;
      const extension = source.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1]?.toLowerCase() ?? null;
      return {
        tag: element.tagName.toLowerCase(),
        source,
        extension,
        loading: element.getAttribute('loading'),
        preload: element.getAttribute('preload'),
        width: element instanceof HTMLImageElement ? element.naturalWidth : null,
        height: element instanceof HTMLImageElement ? element.naturalHeight : null,
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        belowFold: rect.top > window.innerHeight
      };
    }));

    const invalidDimensions = media.filter(asset => asset.tag === 'img' && (asset.width === 0 || asset.height === 0));
    const eagerBelowFoldImages = media.filter(asset => asset.tag === 'img' && asset.belowFold && asset.loading !== 'lazy');
    const largeAssets = media
      .map(asset => ({ ...asset, bytes: assetSizes.get(asset.source) ?? 0 }))
      .filter(asset => asset.bytes > 500_000);

    reports.push({ path, media, invalidDimensions, eagerBelowFoldImages, largeAssets });
  }

  console.log(JSON.stringify({ reports }, null, 2));

  expect(reports.every(report => report.invalidDimensions.length === 0), 'Images should have loaded dimensions').toBe(true);
});

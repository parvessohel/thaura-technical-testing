import { expect, test } from '@playwright/test';

const pagesToCheck = ['/', '/home', '/pricing', '/api-platform', '/faq'];

function readMetaTags(html: string, attribute: 'name' | 'property', value: string): string[] {
  const pattern = new RegExp(
    `<meta\\b[^>]*\\b${attribute}=["']${value}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`,
    'gi'
  );
  return [...html.matchAll(pattern)].map(match => match[1]);
}

function readCanonicalTags(html: string): string[] {
  const pattern = /<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']*)["'][^>]*>/gi;
  return [...html.matchAll(pattern)].map(match => match[1]);
}

test('Raw metadata is present and non-duplicated on key pages', async ({ request }) => {
  const results = [];

  for (const path of pagesToCheck) {
    const response = await request.get(`https://thaura.ai${path}`);
    const html = await response.text();
    const titleMatches = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(match =>
      match[1].trim()
    );
    const descriptions = readMetaTags(html, 'name', 'description');
    const canonicals = readCanonicalTags(html);
    const ogTitles = readMetaTags(html, 'property', 'og:title');
    const ogDescriptions = readMetaTags(html, 'property', 'og:description');
    const ogUrls = readMetaTags(html, 'property', 'og:url');
    const twitterCards = readMetaTags(html, 'name', 'twitter:card');

    results.push({
      path,
      status: response.status(),
      titleMatches,
      descriptions,
      canonicals,
      ogTitles,
      ogDescriptions,
      ogUrls,
      twitterCards
    });
  }

  console.log(JSON.stringify(results, null, 2));
  expect(results.every(result => result.status === 200), 'Key pages should return HTTP 200').toBe(true);
  expect(results.every(result => result.titleMatches.length === 1), 'Each page should have one title').toBe(true);
  expect(results.every(result => result.descriptions.length <= 1), 'Descriptions should not be duplicated').toBe(true);
  expect(results.every(result => result.canonicals.length <= 1), 'Canonical tags should not be duplicated').toBe(true);
});
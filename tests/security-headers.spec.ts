import { expect, test } from '@playwright/test';

const pagesToCheck = ['/', '/pricing', '/api-platform', '/faq', '/contact'];
const securityHeaders = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy'
];

test('HTTPS and security response headers baseline', async ({ request }) => {
  const httpsResults = [];
  for (const path of pagesToCheck) {
    const response = await request.get(`https://thaura.ai${path}`);
    const headers = response.headers();
    httpsResults.push({
      path,
      status: response.status(),
      headers: Object.fromEntries(securityHeaders.map(name => [name, headers[name] ?? null])),
      setCookie: headers['set-cookie'] ?? null
    });
  }

  const httpResponse = await request.get('http://thaura.ai/', { maxRedirects: 0, failOnStatusCode: false });
  const httpResults = {
    status: httpResponse.status(),
    location: httpResponse.headers()['location'] ?? null
  };

  console.log(JSON.stringify({ httpsResults, httpResults }, null, 2));
  expect(httpsResults.every(result => result.status === 200), 'HTTPS pages should return HTTP 200').toBe(true);
  expect([301, 302, 307, 308]).toContain(httpResults.status);
  expect(httpResults.location, 'HTTP should redirect to HTTPS').toMatch(/^https:\/\//);
});
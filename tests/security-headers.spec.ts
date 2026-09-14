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

function parseSetCookieHeader(header: string) {
  const [nameValue, ...attributes] = header.split(';').map(part => part.trim());
  const attributesMap = Object.fromEntries(
    attributes.map(attribute => {
      const [name, ...value] = attribute.split('=');
      return [name.toLowerCase(), value.join('=') || true];
    })
  );

  return {
    name: nameValue.split('=')[0],
    secure: 'secure' in attributesMap,
    httpOnly: 'httponly' in attributesMap,
    sameSite: attributesMap.samesite ?? null,
    attributes: attributesMap
  };
}

test('HTTPS and security response headers baseline', async ({ request }) => {
  const httpsResults = [];
  for (const path of pagesToCheck) {
    const response = await request.get(`https://thaura.ai${path}`);
    const headers = response.headers();
    httpsResults.push({
      path,
      status: response.status(),
      headers: Object.fromEntries(securityHeaders.map(name => [name, headers[name] ?? null])),
      setCookie: headers['set-cookie'] ?? null,
      cookies: headers['set-cookie']
        ? headers['set-cookie'].split(/,(?=[^;,]+=)/).map(parseSetCookieHeader)
        : []
    });
  }

  const httpResponse = await request.get('http://thaura.ai/', { maxRedirects: 0, failOnStatusCode: false });
  const httpResults = {
    status: httpResponse.status(),
    location: httpResponse.headers()['location'] ?? null
  };

  const cookies = httpsResults.flatMap(result => result.cookies);
  const cookiesMissingSecure = cookies.filter(cookie => !cookie.secure);
  const cookiesMissingSameSite = cookies.filter(cookie => !cookie.sameSite);

  console.log(JSON.stringify({ httpsResults, httpResults, cookiesMissingSecure, cookiesMissingSameSite }, null, 2));
  expect(httpsResults.every(result => result.status === 200), 'HTTPS pages should return HTTP 200').toBe(true);
  expect([301, 302, 307, 308]).toContain(httpResults.status);
  expect(httpResults.location, 'HTTP should redirect to HTTPS').toMatch(/^https:\/\//);
  expect(cookiesMissingSecure, 'Cookies set over HTTPS should include Secure').toEqual([]);
  expect(cookiesMissingSameSite, 'Cookies should declare SameSite').toEqual([]);
});
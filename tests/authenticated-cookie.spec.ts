import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/user.json';

test('Authenticated session cookie has secure attributes and valid expiry', async ({ browser }) => {
  const context = await browser.newContext({ storageState: authStatePath });
  const cookies = await context.cookies('https://thaura.ai');
  const sessionCookie = cookies.find(cookie => cookie.name === 'thaura_token');

  expect(sessionCookie, 'Saved auth state should contain thaura_token').toBeDefined();
  if (!sessionCookie) return;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresInDays = (sessionCookie.expires - nowSeconds) / 86_400;

  console.log(JSON.stringify({
    name: sessionCookie.name,
    domain: sessionCookie.domain,
    path: sessionCookie.path,
    secure: sessionCookie.secure,
    httpOnly: sessionCookie.httpOnly,
    sameSite: sessionCookie.sameSite,
    expiresInDays: Math.round(expiresInDays * 100) / 100
  }, null, 2));

  expect(sessionCookie.domain).toBe('.thaura.ai');
  expect(sessionCookie.path).toBe('/');
  expect(sessionCookie.secure).toBe(true);
  expect(sessionCookie.httpOnly).toBe(true);
  expect(sessionCookie.sameSite).toBe('Lax');
  expect(sessionCookie.expires).toBeGreaterThan(nowSeconds);

  await context.close();
});

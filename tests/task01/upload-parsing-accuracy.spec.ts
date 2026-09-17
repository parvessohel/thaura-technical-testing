import { expect, test } from '@playwright/test';
import path from 'node:path';

const authStatePath = 'playwright/.auth/task01-upload.json';
const fixtureDirectory = path.resolve('tests/task01/fixtures');
const KNOWN_PDF_MARKER = 'TASK01 PDF MARKER';

test('Attached PDF content is parsed and read back accurately, not just accepted', async ({ browser }) => {
  test.setTimeout(150_000);
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const uploadInput = page.locator('input[type="file"]').first();
  await uploadInput.waitFor({ state: 'attached', timeout: 60_000 });
  await uploadInput.setInputFiles(path.join(fixtureDirectory, 'known.pdf'));
  await page.waitForTimeout(1_000);

  const prompt = 'Read the attached PDF and reply with only the exact marker text printed inside it, nothing else.';
  const composer = page.locator('textarea:not([aria-hidden="true"])').first();
  await composer.fill(prompt);
  await composer.press('Enter');

  await expect.poll(async () => {
    const text = await page.locator('body').innerText();
    return text.includes(KNOWN_PDF_MARKER) || /out of messages|5 messages every 5 hours|upgrade to pro|could not|unable to (read|access)/i.test(text);
  }, { timeout: 60_000 }).toBe(true);

  const bodyText = await page.locator('body').innerText();
  const quotaBlocked = /out of messages|5 messages every 5 hours|upgrade to pro/i.test(bodyText);
  const markerReadBack = bodyText.includes(KNOWN_PDF_MARKER);

  console.log(JSON.stringify({
    account: 'shoheltqtec+task01upload@gmail.com',
    fixture: 'known.pdf',
    expectedMarker: KNOWN_PDF_MARKER,
    quotaBlocked,
    markerReadBack,
    bodyTail: bodyText.slice(-1000)
  }, null, 2));

  test.skip(quotaBlocked, 'Fresh upload-test account was quota-blocked before the parsing check could complete.');
  expect(markerReadBack).toBe(true);

  await context.close();
});

import { expect, test } from '@playwright/test';
import path from 'node:path';

const authStatePath = 'playwright/.auth/user.json';
const fixtureDirectory = path.resolve('tests/task01/fixtures');

test('Task 01 upload control accepts safe document and image fixtures', async ({ browser }) => {
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5_000);

  const uploadInput = page.locator('input[type="file"]').first();
  await expect(uploadInput).toHaveAttribute('multiple', '');

  const fixtures = [
    path.join(fixtureDirectory, 'known.pdf'),
    path.join(fixtureDirectory, 'known.csv'),
    path.join(fixtureDirectory, 'known.svg')
  ];
  await uploadInput.setInputFiles(fixtures);
  await page.waitForTimeout(1_000);

  const bodyText = await page.locator('body').innerText();
  const selectedFiles = await uploadInput.evaluate(input =>
    Array.from((input as HTMLInputElement).files ?? []).map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    }))
  );

  console.log(JSON.stringify({ selectedFiles, bodyTail: bodyText.slice(-1200) }, null, 2));

  expect(bodyText).toContain('PDF');
  expect(bodyText).toContain('known.csv');
  expect(bodyText).toContain('CSV');
  await context.close();
});

test('Task 01 upload control accepts an invalid-file fixture for error-path follow-up', async ({ browser }) => {
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5_000);

  const uploadInput = page.locator('input[type="file"]').first();
  await uploadInput.setInputFiles(path.join(fixtureDirectory, 'corrupted.pdf'));
  const selectedFile = await uploadInput.evaluate(input => {
    const file = (input as HTMLInputElement).files?.[0];
    return file ? { name: file.name, type: file.type, size: file.size } : null;
  });

  console.log(JSON.stringify({ selectedFile, bodyTail: (await page.locator('body').innerText()).slice(-800) }, null, 2));
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('corrupted.pdf');
  expect(bodyText).toContain('PDF');
  await context.close();
});
